import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '../../generated/prisma/client.js';
import type { AuthPayload } from '../../auth/auth-payload.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { JobOpeningFindService } from './job-opening-find.service.js';
import { JobApplicationService } from './job-application.service.js';

describe('JobApplicationService', () => {
  const jobOpening = { id: 'job-1', userId: 7, companyId: 1, requirements: [], culturalFits: [] };
  const appliedAt = new Date('2026-10-04T19:53:33.840Z');
  const requester: AuthPayload = {
    sub: 7,
    role: Role.Recruiter,
    name: 'Recruiter',
    email: 'r@example.test',
    companyId: 1,
  };
  const prisma = {
    applicantProfile: { findFirst: vi.fn() },
    jobApplication: { findMany: vi.fn(), create: vi.fn(), deleteMany: vi.fn() },
  };
  const jobOpeningFindService = { findById: vi.fn() };
  let service: JobApplicationService;

  beforeEach(() => {
    vi.clearAllMocks();
    jobOpeningFindService.findById.mockResolvedValue(jobOpening);
    service = new JobApplicationService(
      prisma as unknown as PrismaService,
      jobOpeningFindService as unknown as JobOpeningFindService,
    );
  });

  it('lists applications with only the documented response fields', async () => {
    prisma.jobApplication.findMany.mockResolvedValue([
      {
        profileId: 'profile-1',
        jobOpeningId: 'job-1',
        appliedAt,
        currentStep: null,
        status: 'InProgress',
        stageUpdatedAt: appliedAt,
        closureReason: null,
        closureNotes: null,
        closedAt: null,
        closedBy: null,
        profile: { name: 'Ada Lovelace', skills: [], culturalFits: [] },
      },
    ]);

    await expect(service.findAll('job-1')).resolves.toEqual([
      {
        profileId: 'profile-1',
        profileName: 'Ada Lovelace',
        jobOpeningId: 'job-1',
        appliedAt,
        currentStep: null,
        status: 'InProgress',
        stageUpdatedAt: appliedAt,
        closure: null,
        priority: null,
        priorityScore: {
          requiredSkills: 0,
          requiredBehavioral: 0,
          desiredSkills: 0,
          desiredBehavioral: 0,
        },
      },
    ]);
    expect(prisma.jobApplication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { jobOpeningId: 'job-1' },
        select: expect.objectContaining({
          profileId: true,
          jobOpeningId: true,
          appliedAt: true,
          status: true,
          stageUpdatedAt: true,
          currentStep: expect.any(Object),
        }),
      }),
    );
  });

  it('creates an application for an owner and returns the response contract', async () => {
    prisma.applicantProfile.findFirst.mockResolvedValue({
      name: 'Ada Lovelace',
    });
    const response = {
      profileId: 'profile-1',
      jobOpeningId: 'job-1',
      appliedAt,
      currentStep: null,
      status: 'InProgress',
      stageUpdatedAt: appliedAt,
      closureReason: null,
      closureNotes: null,
      closedAt: null,
      closedBy: null,
      profile: { name: 'Ada Lovelace' },
    };
    prisma.jobApplication.create.mockResolvedValue(response);

    await expect(
      service.create(requester, 'job-1', { profileId: 'profile-1' }),
    ).resolves.toEqual({
      profileId: 'profile-1',
      profileName: 'Ada Lovelace',
      jobOpeningId: 'job-1',
      appliedAt,
      currentStep: null,
      status: 'InProgress',
      stageUpdatedAt: appliedAt,
      closure: null,
    });
    expect(prisma.applicantProfile.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'profile-1', companyId: 1 } }),
    );
    expect(prisma.jobApplication.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ jobOpeningId: 'job-1', profileId: 'profile-1' }),
      }),
    );
  });

  it('denies a non-owner and allows an administrator to manage applications', async () => {
    await expect(
      service.create({ ...requester, sub: 8 }, 'job-1', {
        profileId: 'profile-1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.applicantProfile.findFirst).not.toHaveBeenCalled();

    prisma.jobApplication.create.mockResolvedValue({
      profileId: 'profile-1',
      jobOpeningId: 'job-1',
      appliedAt,
      currentStep: null,
      status: 'InProgress',
      stageUpdatedAt: appliedAt,
      closureReason: null,
      closureNotes: null,
      closedAt: null,
      closedBy: null,
      profile: { name: 'Ada Lovelace' },
    });
    prisma.applicantProfile.findFirst.mockResolvedValue({
      name: 'Ada Lovelace',
    });
    await expect(
      service.create({ ...requester, sub: 8, role: Role.Admin }, 'job-1', {
        profileId: 'profile-1',
      }),
    ).resolves.toMatchObject({ profileName: 'Ada Lovelace' });
  });

  it('returns 404 for missing profiles and 409 for duplicate applications', async () => {
    prisma.applicantProfile.findFirst.mockResolvedValue(null);
    await expect(
      service.create(requester, 'job-1', { profileId: 'missing' }),
    ).rejects.toBeInstanceOf(NotFoundException);

    prisma.applicantProfile.findFirst.mockResolvedValue({
      name: 'Ada Lovelace',
    });
    prisma.jobApplication.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );
    await expect(
      service.create(requester, 'job-1', { profileId: 'profile-1' }),
    ).rejects.toBeInstanceOf(ConflictException);

    prisma.jobApplication.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('foreign key', {
        code: 'P2003',
        clientVersion: 'test',
      }),
    );
    await expect(
      service.create(requester, 'job-1', { profileId: 'profile-1' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 404 for missing job openings or applications and authorizes removal', async () => {
    jobOpeningFindService.findById.mockRejectedValueOnce(
      new NotFoundException(),
    );
    await expect(service.findAll('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    jobOpeningFindService.findById.mockResolvedValue(jobOpening);
    prisma.jobApplication.deleteMany.mockResolvedValue({ count: 0 });
    await expect(
      service.remove(requester, 'job-1', 'profile-1'),
    ).rejects.toBeInstanceOf(NotFoundException);

    await expect(
      service.remove({ ...requester, sub: 8 }, 'job-1', 'profile-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.jobApplication.deleteMany).toHaveBeenCalledTimes(1);

    prisma.jobApplication.deleteMany.mockResolvedValue({ count: 1 });
    await expect(
      service.remove(
        { ...requester, sub: 8, role: Role.Admin },
        'job-1',
        'profile-1',
      ),
    ).resolves.toBeUndefined();
  });

  it('denies an administrator from another company', async () => {
    await expect(
      service.create({ ...requester, sub: 8, role: Role.Admin, companyId: 2 }, 'job-1', {
        profileId: 'profile-1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.applicantProfile.findFirst).not.toHaveBeenCalled();
  });

  it('does not link a profile owned by another company', async () => {
    prisma.applicantProfile.findFirst.mockResolvedValue(null);
    await expect(
      service.create(requester, 'job-1', { profileId: 'other-company-profile' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.applicantProfile.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'other-company-profile', companyId: 1 } }),
    );
    expect(prisma.jobApplication.create).not.toHaveBeenCalled();
  });
});
