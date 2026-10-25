import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthPayload } from '../../auth/auth-payload.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  isForeignKeyConstraintViolation,
  isUniqueConstraintViolation,
} from '../../prisma/prisma-error.js';
import { assertCanManageJobOpening } from '../job-opening-access.js';
import { CreateJobApplicationDto } from '../dto/create-job-application.dto.js';
import { JobApplicationResponseDto } from '../dto/job-application-response.dto.js';
import { JobOpeningFindService } from './job-opening-find.service.js';

@Injectable()
export class JobApplicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobOpeningFindService: JobOpeningFindService,
  ) {}

  async findAll(jobOpeningId: string): Promise<JobApplicationResponseDto[]> {
    await this.jobOpeningFindService.findById(jobOpeningId);
    const applications = await this.prisma.jobApplication.findMany({
      where: { jobOpeningId },
      select: {
        profileId: true,
        jobOpeningId: true,
        appliedAt: true,
        profile: { select: { name: true } },
      },
      orderBy: { appliedAt: 'desc' },
    });

    return applications.map(({ profile, ...application }) => ({
      ...application,
      profileName: profile.name,
    }));
  }

  async create(
    requester: AuthPayload,
    jobOpeningId: string,
    dto: CreateJobApplicationDto,
  ): Promise<JobApplicationResponseDto> {
    const jobOpening = await this.jobOpeningFindService.findById(jobOpeningId);
    assertCanManageJobOpening(requester, jobOpening);

    const profile = await this.prisma.applicantProfile.findUnique({
      where: { id: dto.profileId },
      select: { name: true },
    });
    if (profile === null) {
      throw new NotFoundException(`Profile with id ${dto.profileId} not found`);
    }

    try {
      const application = await this.prisma.jobApplication.create({
        data: { jobOpeningId, profileId: dto.profileId },
        select: {
          profileId: true,
          jobOpeningId: true,
          appliedAt: true,
          profile: { select: { name: true } },
        },
      });

      const { profile: applicationProfile, ...response } = application;
      return { ...response, profileName: applicationProfile.name };
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException(
          'The profile has already applied to this job opening',
        );
      }
      if (isForeignKeyConstraintViolation(error)) {
        throw new NotFoundException(
          'The profile or job opening no longer exists',
        );
      }
      throw error;
    }
  }

  async remove(
    requester: AuthPayload,
    jobOpeningId: string,
    profileId: string,
  ): Promise<void> {
    const jobOpening = await this.jobOpeningFindService.findById(jobOpeningId);
    assertCanManageJobOpening(requester, jobOpening);

    const result = await this.prisma.jobApplication.deleteMany({
      where: { jobOpeningId, profileId },
    });
    if (result.count === 0) {
      throw new NotFoundException('Job application not found');
    }
  }
}
