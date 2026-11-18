import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ProfileWithRelations } from '../profile-types.js';

export const profileInclude = {
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
      closedBy: { select: { id: true, name: true } },
    },
  },
  profileInterviews: {
    orderBy: { startDate: 'desc' },
  },
  createdBy: { select: { id: true, name: true } },
} satisfies Prisma.ApplicantProfileInclude;

export const profileDetailInclude = {
  ...profileInclude,
  competencyEvidence: { orderBy: { createdAt: 'desc' } },
} satisfies Prisma.ApplicantProfileInclude;

@Injectable()
export class ProfileFindService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(companyId: number): Promise<ProfileWithRelations[]> {
    return this.prisma.applicantProfile.findMany({
      where: { companyId },
      include: profileInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Perfis de outra empresa respondem 404 para não revelar que existem. */
  async findById(id: string, companyId: number): Promise<ProfileWithRelations> {
    const profile = await this.prisma.applicantProfile.findFirst({
      where: { id, companyId },
      include: profileDetailInclude,
    });

    if (profile === null) {
      throw new NotFoundException(`Profile with id ${id} not found`);
    }

    return profile;
  }
}
