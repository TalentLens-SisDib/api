import { BadGatewayException, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateProfileDto } from '../dto/create-profile.dto.js';
import { ProfileWithRelations } from '../profile-types.js';
import { AiService } from './ai.service.js';
import { SkillsService } from './skills.service.js';
import { CulturalFitService } from './cultural-fit.service.js';

export type CvProfileCreationResult = ProfileWithRelations & { qualityIssues: string[] };

@Injectable()
export class ProfileCreationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly skillsService: SkillsService,
    private readonly culturalFitService: CulturalFitService,
  ) {}

  async createFromCv(file: Express.Multer.File): Promise<CvProfileCreationResult> {
    const parsed = typeof this.aiService.parsePdfWithQuality === 'function'
      ? await this.aiService.parsePdfWithQuality(file)
      : { profile: await this.aiService.parsePdf(file), qualityIssues: [] };
    const dto = await this.validateParsedProfile(parsed.profile);
    const profile = await this.create(dto);
    return { ...profile, qualityIssues: parsed.qualityIssues };
  }

  async create(dto: CreateProfileDto): Promise<ProfileWithRelations> {
    const { skills, culturalFits, educationalBackground, ...profileData } = dto;

    return await this.prisma.$transaction(async (tx) => {
      const profile = await tx.applicantProfile.create({
        data: {
          ...profileData,
          ...(educationalBackground !== undefined && {
            educationalBackground: {
              create: educationalBackground.map(({ startDate, endDate, ...education }) => ({
                ...education,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
              })),
            },
          }),
        },
      });

      if (skills && skills.length > 0) {
        const skillRecords = await this.skillsService.upsertSkills(tx, skills);
        await tx.profileSkill.createMany({
          data: skillRecords.map((skill) => ({
            profileId: profile.id,
            requirementId: skill.id,
          })),
        });
      }

      if (culturalFits && culturalFits.length > 0) {
        const culturalFitRecords = await this.culturalFitService.upsertCulturalFits(tx, culturalFits);
        await tx.profileCulturalFit.createMany({
          data: culturalFitRecords.map((culturalFit) => ({
            profileId: profile.id,
            culturalFitId: culturalFit.id,
          })),
        });
      }

      return this.findByIdWithSkills(tx, profile.id);
    });
  }

  private async findByIdWithSkills(tx: Prisma.TransactionClient, id: string) {
    return tx.applicantProfile.findUniqueOrThrow({
      where: { id },
      include: {
        skills: {
          include: {
            requirement: true,
          },
        },
        culturalFits: {
          include: {
            culturalFit: true,
          },
        },
        educationalBackground: true,
        applications: {
          include: {
            jobOpening: true,
          },
        },
        profileInterviews: {
          orderBy: { startDate: 'desc' },
        },
      },
    });
  }

  private async validateParsedProfile(parsed: unknown): Promise<CreateProfileDto> {
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new BadGatewayException('AI service returned an invalid candidate profile');
    }

    const dto = plainToInstance(CreateProfileDto, parsed);
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    });

    if (errors.length > 0) {
      throw new BadGatewayException('AI service returned an invalid candidate profile');
    }

    const hasInvalidEducationRange = (dto.educationalBackground ?? []).some(({ startDate, endDate }) => {
      const start = new Date(startDate).getTime();
      const end = endDate ? new Date(endDate).getTime() : null;
      return Number.isNaN(start) || (end !== null && (Number.isNaN(end) || end < start));
    });
    if (hasInvalidEducationRange) {
      throw new BadGatewayException('AI service returned an invalid candidate profile');
    }

    return dto;
  }
}
