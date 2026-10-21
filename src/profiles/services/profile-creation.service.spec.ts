import { BadGatewayException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateProfileDto } from '../dto/create-profile.dto.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ProfileCreationService } from './profile-creation.service.js';
import { SkillsService } from './skills.service.js';

vi.mock('./ai.service.js', () => ({ AiService: class AiService {} }));

describe('ProfileCreationService.createFromCv', () => {
  const cv = {
    originalname: 'candidate.pdf',
    mimetype: 'application/pdf',
    size: 100,
    buffer: Buffer.from('%PDF-1.7'),
  } as Express.Multer.File;
  const profile = {
    id: 'profile-1',
    name: 'Ada Lovelace',
    description: 'Analytical engine pioneer',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    skills: [{ requirement: { id: 'skill-1', name: 'Mathematics', description: null } }],
    educationalBackground: [
      {
        id: 'education-1',
        institution: 'University of London',
        degree: 'Mathematics',
        startDate: new Date('1830-01-01T00:00:00.000Z'),
        endDate: null,
        profileId: 'profile-1',
      },
    ],
  };

  let service: ProfileCreationService;
  let aiService: { parsePdf: ReturnType<typeof vi.fn> };
  let prisma: { $transaction: ReturnType<typeof vi.fn> };
  let skillsService: { upsertSkills: ReturnType<typeof vi.fn> };
  let tx: {
    applicantProfile: { create: ReturnType<typeof vi.fn>; findUniqueOrThrow: ReturnType<typeof vi.fn> };
    profileSkill: { createMany: ReturnType<typeof vi.fn> };
  };

  beforeEach(() => {
    tx = {
      applicantProfile: {
        create: vi.fn().mockResolvedValue({ id: 'profile-1' }),
        findUniqueOrThrow: vi.fn().mockResolvedValue(profile),
      },
      profileSkill: { createMany: vi.fn().mockResolvedValue({ count: 1 }) },
    };
    prisma = {
      $transaction: vi.fn(async (callback: (transaction: typeof tx) => unknown) => callback(tx)),
    };
    aiService = { parsePdf: vi.fn() };
    skillsService = { upsertSkills: vi.fn().mockResolvedValue([{ id: 'skill-1', name: 'Mathematics' }]) };
    service = new ProfileCreationService(
      prisma as unknown as PrismaService,
      aiService as never,
      skillsService as unknown as SkillsService,
    );
  });

  it('validates the AI profile and persists profile, skills, and education in one transaction', async () => {
    aiService.parsePdf.mockResolvedValue({
      name: 'Ada Lovelace',
      description: 'Analytical engine pioneer',
      skills: ['Mathematics'],
      educationalBackground: [
        {
          institution: 'University of London',
          degree: 'Mathematics',
          startDate: '1830-01-01',
          endDate: null,
        },
      ],
    } satisfies CreateProfileDto);

    const result = await service.createFromCv(cv);

    expect(aiService.parsePdf).toHaveBeenCalledWith(cv);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.applicantProfile.create).toHaveBeenCalledWith({
      data: {
        name: 'Ada Lovelace',
        description: 'Analytical engine pioneer',
        educationalBackground: {
          create: [
            {
              institution: 'University of London',
              degree: 'Mathematics',
              startDate: new Date('1830-01-01'),
              endDate: null,
            },
          ],
        },
      },
    });
    expect(skillsService.upsertSkills).toHaveBeenCalledWith(tx, ['Mathematics']);
    expect(tx.profileSkill.createMany).toHaveBeenCalledWith({
      data: [{ profileId: 'profile-1', requirementId: 'skill-1' }],
    });
    expect(tx.applicantProfile.findUniqueOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'profile-1' },
        include: expect.objectContaining({ educationalBackground: true }),
      }),
    );
    expect(result.educationalBackground).toEqual(profile.educationalBackground);
  });

  it.each([
    ['null result', null],
    ['array result', []],
    ['blank candidate name', { name: '   ' }],
    [
      'invalid calendar date',
      {
        name: 'Ada Lovelace',
        educationalBackground: [
          { institution: 'University', degree: 'Mathematics', startDate: '2024-02-31' },
        ],
      },
    ],
    [
      'education end date before start date',
      {
        name: 'Ada Lovelace',
        educationalBackground: [
          { institution: 'University', degree: 'Mathematics', startDate: '2022-01-01', endDate: '2020-01-01' },
        ],
      },
    ],
    ['null education entry', { name: 'Ada Lovelace', educationalBackground: [null] }],
    ['null skills list', { name: 'Ada Lovelace', skills: null }],
  ])('rejects %s before creating records', async (_label, parsed) => {
    aiService.parsePdf.mockResolvedValue(parsed as CreateProfileDto);

    await expect(service.createFromCv(cv)).rejects.toBeInstanceOf(BadGatewayException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('does not create a profile when the AI parser fails', async () => {
    aiService.parsePdf.mockRejectedValue(new BadGatewayException('provider unavailable'));

    await expect(service.createFromCv(cv)).rejects.toThrow('provider unavailable');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
