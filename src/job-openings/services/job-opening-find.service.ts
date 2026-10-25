import { Injectable, NotFoundException } from '@nestjs/common';
import { JobOpening } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class JobOpeningFindService {
  constructor(private readonly prisma: PrismaService) {}

  findAllByCompany(companyId: number): Promise<Array<JobOpening & { requirements: Array<{ requirement: { id: string; name: string; description: string | null } } & { isRequired: boolean }>; culturalFits: Array<{ culturalFit: { id: string; name: string; description: string | null } } & { isRequired: boolean }> }>> {
    return this.prisma.jobOpening.findMany({
      where: { companyId },
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
      orderBy: { createdAt: 'desc' },
    });
  }

  findAllByUser(userId: number): Promise<Array<JobOpening & { requirements: Array<{ requirement: { id: string; name: string; description: string | null } } & { isRequired: boolean }>; culturalFits: Array<{ culturalFit: { id: string; name: string; description: string | null } } & { isRequired: boolean }> }>> {
    return this.prisma.jobOpening.findMany({
      where: { userId },
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<JobOpening & { requirements: Array<{ requirement: { id: string; name: string; description: string | null } } & { isRequired: boolean }>; culturalFits: Array<{ culturalFit: { id: string; name: string; description: string | null } } & { isRequired: boolean }> }> {
    const jobOpening = await this.prisma.jobOpening.findUnique({
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

    if (jobOpening === null) {
      throw new NotFoundException(`Job opening with id ${id} not found`);
    }

    return jobOpening;
  }
}