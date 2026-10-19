import { Injectable, NotFoundException } from '@nestjs/common';
import { ApplicantProfile } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class ProfileFindService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<ApplicantProfile[]> {
    return this.prisma.applicantProfile.findMany({
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<ApplicantProfile & { skills: Array<{ requirement: { id: string; name: string; description: string | null } }> }> {
    const profile = await this.prisma.applicantProfile.findUnique({
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

    if (profile === null) {
      throw new NotFoundException(`Profile with id ${id} not found`);
    }

    return profile;
  }
}