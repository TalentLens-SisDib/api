import { Injectable } from '@nestjs/common';
import { Prisma, JobOpening } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UpdateJobOpeningDto } from '../dto/update-job-opening.dto.js';
import { JobOpeningSkillDto, JobOpeningCulturalFitDto } from '../dto/create-job-opening.dto.js';
import { JobOpeningFindService } from './job-opening-find.service.js';
import { assertCanManageJobOpening } from '../job-opening-access.js';
import type { AuthPayload } from '../../auth/auth-payload.js';

@Injectable()
export class JobOpeningEditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobOpeningFindService: JobOpeningFindService,
  ) {}

  async update(
    requester: AuthPayload,
    id: string,
    dto: UpdateJobOpeningDto,
  ): Promise<JobOpening & { requirements: Array<{ requirement: { id: string; name: string; description: string | null } } & { isRequired: boolean }>; culturalFits: Array<{ culturalFit: { id: string; name: string; description: string | null } } & { isRequired: boolean }> }> {
    const jobOpening = await this.jobOpeningFindService.findById(id);
    assertCanManageJobOpening(requester, jobOpening);

    const { skills, culturalFits, ...updateData } = dto;

    return await this.prisma.$transaction(async (tx) => {
      await tx.jobOpening.update({
        where: { id },
        data: updateData,
      });

      if (skills !== undefined) {
        await tx.jobOpeningRequirement.deleteMany({
          where: { jobOpeningId: id },
        });

        if (skills.length > 0) {
          await tx.jobOpeningRequirement.createMany({
            data: skills.map((skill: JobOpeningSkillDto) => ({
              jobOpeningId: id,
              requirementId: skill.skillId,
              isRequired: skill.isRequired,
            })),
          });
        }
      }

      if (culturalFits !== undefined) {
        await tx.jobOpeningCulturalFit.deleteMany({
          where: { jobOpeningId: id },
        });

        if (culturalFits.length > 0) {
          await tx.jobOpeningCulturalFit.createMany({
            data: culturalFits.map((culturalFit: JobOpeningCulturalFitDto) => ({
              jobOpeningId: id,
              culturalFitId: culturalFit.culturalFitId,
              isRequired: culturalFit.isRequired,
            })),
          });
        }
      }

      return this.findByIdWithSkills(tx, id);
    });
  }

  private async findByIdWithSkills(tx: Prisma.TransactionClient, id: string) {
    return tx.jobOpening.findUniqueOrThrow({
      where: { id },
      include: {
        requirements: {
          include: {
            requirement: true,
          },
        },
        culturalFits: {
          include: {
            culturalFit: true,
          },
        },
      },
    });
  }
}