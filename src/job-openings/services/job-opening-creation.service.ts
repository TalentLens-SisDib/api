import { Injectable } from '@nestjs/common';
import { Prisma, JobOpening } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateJobOpeningDto, JobOpeningSkillDto } from '../dto/create-job-opening.dto.js';
import type { AuthPayload } from '../../auth/auth-payload.js';

@Injectable()
export class JobOpeningCreationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(requester: AuthPayload, dto: CreateJobOpeningDto): Promise<JobOpening & { requirements: Array<{ requirement: { id: string; name: string; description: string | null } } & { isRequired: boolean }> }> {
    const { skills, ...jobOpeningData } = dto;

    return await this.prisma.$transaction(async (tx) => {
      const jobOpening = await tx.jobOpening.create({
        data: {
          ...jobOpeningData,
          companyId: requester.companyId,
          userId: requester.sub,
        },
      });

      if (skills && skills.length > 0) {
        await tx.jobOpeningRequirement.createMany({
          data: skills.map((skill: JobOpeningSkillDto) => ({
            jobOpeningId: jobOpening.id,
            requirementId: skill.skillId,
            isRequired: skill.isRequired,
          })),
        });
      }

      return this.findByIdWithSkills(tx, jobOpening.id);
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
      },
    });
  }
}