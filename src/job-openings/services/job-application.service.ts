import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApplicationStatus, ClosureReason, Prisma } from '../../generated/prisma/client.js';
import type { AuthPayload } from '../../auth/auth-payload.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  isForeignKeyConstraintViolation,
  isUniqueConstraintViolation,
} from '../../prisma/prisma-error.js';
import { assertCanManageJobOpening } from '../job-opening-access.js';
import { CreateJobApplicationDto } from '../dto/create-job-application.dto.js';
import { AdvanceJobApplicationDto } from '../dto/advance-job-application.dto.js';
import { JobApplicationResponseDto } from '../dto/job-application-response.dto.js';
import { UpdateJobApplicationStatusDto } from '../dto/update-job-application-status.dto.js';
import { JobOpeningFindService } from './job-opening-find.service.js';

const applicationResponseSelect = {
  profileId: true,
  jobOpeningId: true,
  appliedAt: true,
  status: true,
  stageUpdatedAt: true,
  closureReason: true,
  closureNotes: true,
  closedAt: true,
  closedBy: { select: { id: true, name: true } },
  currentStep: { select: { id: true, name: true, order: true } },
  profile: { select: { name: true } },
} satisfies Prisma.JobApplicationSelect;

const applicationListSelect = {
  ...applicationResponseSelect,
  profile: {
    select: {
      name: true,
      skills: { select: { requirementId: true } },
      culturalFits: { select: { culturalFitId: true } },
    },
  },
} satisfies Prisma.JobApplicationSelect;

type SelectedJobApplicationResponse = Prisma.JobApplicationGetPayload<{
  select: typeof applicationResponseSelect;
}>;

type CandidatePriorityScore = {
  requiredSkills: number;
  requiredBehavioral: number;
  desiredSkills: number;
  desiredBehavioral: number;
};

function comparePriorityScores(a: CandidatePriorityScore, b: CandidatePriorityScore): number {
  return (
    b.requiredSkills - a.requiredSkills ||
    b.requiredBehavioral - a.requiredBehavioral ||
    b.desiredSkills - a.desiredSkills ||
    b.desiredBehavioral - a.desiredBehavioral
  );
}

function toResponse(
  application: SelectedJobApplicationResponse,
): JobApplicationResponseDto {
  const { profile, closureReason, closureNotes, closedAt, closedBy, ...response } = application;
  return {
    ...response,
    profileName: profile.name,
    closure: closureReason === null ? null : {
      reason: closureReason,
      notes: closureNotes,
      closedAt: closedAt!,
      closedBy,
    },
  };
}

@Injectable()
export class JobApplicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobOpeningFindService: JobOpeningFindService,
  ) {}

  async findAll(jobOpeningId: string): Promise<JobApplicationResponseDto[]> {
    const jobOpening = await this.jobOpeningFindService.findById(jobOpeningId);
    const applications = await this.prisma.jobApplication.findMany({
      where: { jobOpeningId },
      select: applicationListSelect,
      orderBy: { appliedAt: 'desc' },
    });

    const requiredSkills = jobOpening.requirements.filter((criterion) => criterion.isRequired);
    const desiredSkills = jobOpening.requirements.filter((criterion) => !criterion.isRequired);
    const requiredBehavioral = jobOpening.culturalFits.filter((criterion) => criterion.isRequired);
    const desiredBehavioral = jobOpening.culturalFits.filter((criterion) => !criterion.isRequired);
    const hasCriteria = jobOpening.requirements.length + jobOpening.culturalFits.length > 0;
    const rows: (JobApplicationResponseDto & {
      priority: number | null;
      priorityScore: CandidatePriorityScore;
    })[] = applications.map(({ profile, ...application }) => {
      const profileSkills = new Set(profile.skills.map((skill) => skill.requirementId));
      const profileFits = new Set(profile.culturalFits.map((fit) => fit.culturalFitId));
      return {
        ...toResponse({ ...application, profile }),
        priority: null,
        priorityScore: {
          requiredSkills: requiredSkills.filter((criterion) => profileSkills.has(criterion.requirement.id)).length,
          requiredBehavioral: requiredBehavioral.filter((criterion) => profileFits.has(criterion.culturalFit.id)).length,
          desiredSkills: desiredSkills.filter((criterion) => profileSkills.has(criterion.requirement.id)).length,
          desiredBehavioral: desiredBehavioral.filter((criterion) => profileFits.has(criterion.culturalFit.id)).length,
        },
      };
    });

    rows.sort((a, b) =>
      comparePriorityScores(a.priorityScore, b.priorityScore) ||
      b.appliedAt.getTime() - a.appliedAt.getTime(),
    );
    if (hasCriteria) {
      let priority = 0;
      let previousScore: CandidatePriorityScore | undefined;
      for (const [index, row] of rows.entries()) {
        if (!previousScore || comparePriorityScores(row.priorityScore, previousScore) !== 0) {
          priority = index + 1;
        }
        row.priority = priority;
        previousScore = row.priorityScore;
      }
    }
    return rows;
  }

  async create(
    requester: AuthPayload,
    jobOpeningId: string,
    dto: CreateJobApplicationDto,
  ): Promise<JobApplicationResponseDto> {
    const jobOpening = await this.jobOpeningFindService.findById(jobOpeningId);
    assertCanManageJobOpening(requester, jobOpening);

    // Só candidatos da mesma empresa da vaga podem ser vinculados.
    const profile = await this.prisma.applicantProfile.findFirst({
      where: { id: dto.profileId, companyId: jobOpening.companyId },
      select: { name: true },
    });
    if (profile === null) {
      throw new NotFoundException(`Profile with id ${dto.profileId} not found`);
    }

    try {
      const now = new Date();
      const application = await this.prisma.jobApplication.create({
        data: {
          jobOpeningId,
          profileId: dto.profileId,
          appliedAt: now,
          stageUpdatedAt: now,
        },
        select: applicationResponseSelect,
      });
      return toResponse(application);
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

  async advance(
    requester: AuthPayload,
    jobOpeningId: string,
    profileId: string,
    dto: AdvanceJobApplicationDto,
  ): Promise<JobApplicationResponseDto> {
    const jobOpening = await this.jobOpeningFindService.findById(jobOpeningId);
    assertCanManageJobOpening(requester, jobOpening);

    const application = await this.prisma.jobApplication.findUnique({
      where: { profileId_jobOpeningId: { profileId, jobOpeningId } },
      select: { currentStepId: true, status: true },
    });
    if (!application) throw new NotFoundException('Job application not found');
    if (
      application.status !== ApplicationStatus.InProgress ||
      application.currentStepId !== dto.fromStepId
    ) {
      throw new ConflictException('The application stage has changed');
    }

    const steps = await this.prisma.step.findMany({
      where: { jobOpeningId },
      orderBy: { order: 'asc' },
      select: { id: true },
    });
    const currentIndex = dto.fromStepId === null
      ? -1
      : steps.findIndex((step) => step.id === dto.fromStepId);
    if (dto.fromStepId !== null && currentIndex < 0) {
      throw new ConflictException('The current stage is no longer available');
    }
    const nextStep = steps[currentIndex + 1];
    if (!nextStep) throw new ConflictException('The application cannot advance');

    const updated = await this.prisma.jobApplication.updateMany({
      where: {
        profileId,
        jobOpeningId,
        currentStepId: dto.fromStepId,
        status: ApplicationStatus.InProgress,
      },
      data: { currentStepId: nextStep.id, stageUpdatedAt: new Date() },
    });
    if (updated.count === 0) {
      throw new ConflictException('The application stage has changed');
    }

    return this.getResponse(jobOpeningId, profileId);
  }

  async updateStatus(
    requester: AuthPayload,
    jobOpeningId: string,
    profileId: string,
    dto: UpdateJobApplicationStatusDto,
  ): Promise<JobApplicationResponseDto> {
    const jobOpening = await this.jobOpeningFindService.findById(jobOpeningId);
    assertCanManageJobOpening(requester, jobOpening);

    const application = await this.prisma.jobApplication.findUnique({
      where: { profileId_jobOpeningId: { profileId, jobOpeningId } },
      select: { currentStepId: true, status: true },
    });
    if (!application) throw new NotFoundException('Job application not found');
    if (dto.status !== ApplicationStatus.Rejected && dto.closure) {
      throw new BadRequestException('Closure details are only allowed when rejecting an application');
    }
    if (application.status === dto.status) {
      return this.getResponse(jobOpeningId, profileId);
    }
    if (dto.status === ApplicationStatus.Rejected && !dto.closure) {
      throw new BadRequestException('Closure details are required when rejecting an application');
    }
    const notes = dto.closure?.notes?.trim();
    if (dto.closure?.reason === ClosureReason.Other && !notes) {
      throw new BadRequestException('Closure notes are required for the Other reason');
    }
    if (
      application.status !== ApplicationStatus.InProgress &&
      dto.status !== ApplicationStatus.InProgress
    ) {
      throw new ConflictException('Reopen the application before changing its status');
    }
    if (dto.status === ApplicationStatus.Hired) {
      const lastStep = await this.prisma.step.findFirst({
        where: { jobOpeningId },
        orderBy: { order: 'desc' },
        select: { id: true },
      });
      if (!lastStep || application.currentStepId !== lastStep.id) {
        throw new ConflictException('The application must reach the last stage first');
      }
    }

    const now = new Date();
    const updated = await this.prisma.jobApplication.updateMany({
      where: {
        profileId,
        jobOpeningId,
        currentStepId: application.currentStepId,
        status: application.status,
      },
      data: {
        status: dto.status,
        stageUpdatedAt: now,
        closureReason: dto.status === ApplicationStatus.Rejected ? dto.closure!.reason : null,
        closureNotes: dto.status === ApplicationStatus.Rejected ? notes || null : null,
        closedAt: dto.status === ApplicationStatus.Rejected ? now : null,
        closedById: dto.status === ApplicationStatus.Rejected ? requester.sub : null,
      },
    });
    if (updated.count === 0) {
      throw new ConflictException('The application status has changed');
    }

    return this.getResponse(jobOpeningId, profileId);
  }

  private async getResponse(
    jobOpeningId: string,
    profileId: string,
  ): Promise<JobApplicationResponseDto> {
    const application = await this.prisma.jobApplication.findUnique({
      where: { profileId_jobOpeningId: { profileId, jobOpeningId } },
      select: applicationResponseSelect,
    });
    if (!application) throw new NotFoundException('Job application not found');
    return toResponse(application);
  }
}
