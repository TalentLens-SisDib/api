import { Injectable } from '@nestjs/common';
import { Prisma, ApplicantProfile } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateProfileDto, ProfileSkillDto } from '../dto/create-profile.dto.js';
import { AiService } from './ai.service.js';

@Injectable()
export class ProfileCreationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async createFromCv(file: Express.Multer.File): Promise<ApplicantProfile & { skills: Array<{ requirement: { id: string; name: string; description: string | null } }> }> {
    const dto = await this.aiService.parsePdf(file);
    return this.create(dto);
  }

  async create(dto: CreateProfileDto): Promise<ApplicantProfile & { skills: Array<{ requirement: { id: string; name: string; description: string | null } }> }> {
    const { skills, ...profileData } = dto;

    return await this.prisma.$transaction(async (tx) => {
      const profile = await tx.applicantProfile.create({
        data: profileData,
      });

      if (skills && skills.length > 0) {
        await tx.profileSkill.createMany({
          data: skills.map((skill: ProfileSkillDto) => ({
            profileId: profile.id,
            requirementId: skill.skillId,
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
        educationalBackground: true,
        applications: {
          include: {
            jobOpening: true,
          },
        },
      },
    });
  }
}