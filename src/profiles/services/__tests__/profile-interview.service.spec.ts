import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { AuthPayload } from '../../../auth/auth-payload.js';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { ProfileInterviewService } from '../profile-interview.service.js';

const mockPrisma = {
  applicantProfile: { findUnique: vi.fn() },
  interview: { findUnique: vi.fn() },
  jobApplication: { findUnique: vi.fn() },
  profileInterview: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

const owner = { sub: 1 } as AuthPayload;
const otherUser = { sub: 2 } as AuthPayload;

const record = {
  id: 'pi1',
  interviewId: 'i1',
  profileId: 'p1',
  transcript: 'Transcript',
  keyTakeaways: '[]',
  startDate: new Date('2026-01-01T00:00:00Z'),
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

describe('ProfileInterviewService', () => {
  let service: ProfileInterviewService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileInterviewService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(ProfileInterviewService);
  });

  describe('addInterviewToProfile', () => {
    const dto = { interviewId: 'i1', transcript: 'Transcript', keyTakeaways: ['a', 'b'] };

    beforeEach(() => {
      mockPrisma.applicantProfile.findUnique.mockResolvedValue({ id: 'p1' });
      mockPrisma.interview.findUnique.mockResolvedValue({ id: 'i1', userId: 1, step: { jobOpeningId: 'j1' } });
      mockPrisma.jobApplication.findUnique.mockResolvedValue({ profileId: 'p1' });
    });

    it('should create the record when the owner registers a linked candidate', async () => {
      // Arrange
      mockPrisma.profileInterview.create.mockResolvedValue(record);

      // Act
      const result = await service.addInterviewToProfile(owner, 'p1', dto);

      // Assert
      expect(mockPrisma.jobApplication.findUnique).toHaveBeenCalledWith({
        where: { profileId_jobOpeningId: { profileId: 'p1', jobOpeningId: 'j1' } },
        select: { profileId: true },
      });
      expect(mockPrisma.profileInterview.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ interviewId: 'i1', profileId: 'p1', keyTakeaways: '["a","b"]' }),
      });
      expect(result.id).toBe('pi1');
    });

    it('should throw NotFoundException when the profile does not exist', async () => {
      // Arrange
      mockPrisma.applicantProfile.findUnique.mockResolvedValue(null);

      // Act
      const promise = service.addInterviewToProfile(owner, 'p1', dto);

      // Assert
      await expect(promise).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when the interview does not exist', async () => {
      // Arrange
      mockPrisma.interview.findUnique.mockResolvedValue(null);

      // Act
      const promise = service.addInterviewToProfile(owner, 'p1', dto);

      // Assert
      await expect(promise).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when the requester does not own the interview', async () => {
      // Act
      const promise = service.addInterviewToProfile(otherUser, 'p1', dto);

      // Assert
      await expect(promise).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.profileInterview.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when the profile has not applied to the job opening', async () => {
      // Arrange
      mockPrisma.jobApplication.findUnique.mockResolvedValue(null);

      // Act
      const promise = service.addInterviewToProfile(owner, 'p1', dto);

      // Assert
      await expect(promise).rejects.toThrow(BadRequestException);
      expect(mockPrisma.profileInterview.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when the profile already has a record in the interview', async () => {
      // Arrange
      mockPrisma.profileInterview.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      // Act
      const promise = service.addInterviewToProfile(owner, 'p1', dto);

      // Assert
      await expect(promise).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update the record when requested by the interview owner', async () => {
      // Arrange
      mockPrisma.profileInterview.findUnique.mockResolvedValue({ ...record, interview: { userId: 1 } });
      mockPrisma.profileInterview.update.mockResolvedValue({ ...record, transcript: 'New' });

      // Act
      const result = await service.update(owner, 'p1', 'pi1', { transcript: 'New', keyTakeaways: ['x'] });

      // Assert
      expect(mockPrisma.profileInterview.update).toHaveBeenCalledWith({
        where: { id: 'pi1' },
        data: { transcript: 'New', keyTakeaways: '["x"]' },
      });
      expect(result.transcript).toBe('New');
    });

    it('should throw ForbiddenException when requested by another user', async () => {
      // Arrange
      mockPrisma.profileInterview.findUnique.mockResolvedValue({ ...record, interview: { userId: 1 } });

      // Act
      const promise = service.update(otherUser, 'p1', 'pi1', { transcript: 'New' });

      // Assert
      await expect(promise).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.profileInterview.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the record belongs to another profile', async () => {
      // Arrange
      mockPrisma.profileInterview.findUnique.mockResolvedValue({ ...record, profileId: 'p2', interview: { userId: 1 } });

      // Act
      const promise = service.update(owner, 'p1', 'pi1', { transcript: 'New' });

      // Assert
      await expect(promise).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete the record when requested by the interview owner', async () => {
      // Arrange
      mockPrisma.profileInterview.findUnique.mockResolvedValue({ ...record, interview: { userId: 1 } });

      // Act
      await service.remove(owner, 'p1', 'pi1');

      // Assert
      expect(mockPrisma.profileInterview.delete).toHaveBeenCalledWith({ where: { id: 'pi1' } });
    });

    it('should throw ForbiddenException when requested by another user', async () => {
      // Arrange
      mockPrisma.profileInterview.findUnique.mockResolvedValue({ ...record, interview: { userId: 1 } });

      // Act
      const promise = service.remove(otherUser, 'p1', 'pi1');

      // Assert
      await expect(promise).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.profileInterview.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the record does not exist', async () => {
      // Arrange
      mockPrisma.profileInterview.findUnique.mockResolvedValue(null);

      // Act
      const promise = service.remove(owner, 'p1', 'missing');

      // Assert
      await expect(promise).rejects.toThrow(NotFoundException);
    });
  });
});
