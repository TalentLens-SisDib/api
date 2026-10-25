import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ProfileWithRelations } from '../profile-types.js';

@Injectable()
export class ProfileFindService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<ProfileWithRelations[]> {
    return this.prisma.applicantProfile.findMany({
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<ProfileWithRelations> {
    const profile = await this.prisma.applicantProfile.findUnique({
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

    if (profile === null) {
      throw new NotFoundException(`Profile with id ${id} not found`);
    }

    return profile;
  }
}
