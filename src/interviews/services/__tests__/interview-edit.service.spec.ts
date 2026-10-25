import { PrismaService } from '../../../prisma/prisma.service.js';
import { Test, TestingModule } from '@nestjs/testing';
import { InterviewEditService } from '../interview-edit.service.js';
import { InterviewFindService } from '../interview-find.service.js';
import { NotFoundException } from '@nestjs/common';

const mockPrisma = {
  interview: {
    update: vi.fn(),
    findUnique: vi.fn(),
  },
};

const mockInterviewFindService = {
  findById: vi.fn(),
};

describe('InterviewEditService', () => {
  let service: InterviewEditService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewEditService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: InterviewFindService, useValue: mockInterviewFindService },
      ],
    }).compile();

    service = module.get<InterviewEditService>(InterviewEditService);
  });

  describe('update', () => {
    it('should update stepId', async () => {
      // Arrange
      const existingInterview = { id: '1', stepId: 's1', userId: 1, createdAt: new Date(), updatedAt: new Date() };
      const updatedInterview = { ...existingInterview, stepId: 's2' };
      mockInterviewFindService.findById.mockResolvedValue(existingInterview);
      mockPrisma.interview.update.mockResolvedValue(updatedInterview);
      const dto = { stepId: 's2' };

      // Act
      const result = await service.update('1', dto);

      // Assert
      expect(mockInterviewFindService.findById).toHaveBeenCalledWith('1');
      expect(mockPrisma.interview.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { step: { connect: { id: 's2' } } },
        include: {
          profileInterviews: {
            orderBy: { startDate: 'desc' },
          },
        },
      });
      expect(result).toEqual(updatedInterview);
    });

    it('should not update anything when stepId is not provided', async () => {
      // Arrange
      const existingInterview = { id: '1', stepId: 's1', userId: 1, createdAt: new Date(), updatedAt: new Date() };
      mockInterviewFindService.findById.mockResolvedValue(existingInterview);
      mockPrisma.interview.update.mockResolvedValue(existingInterview);
      const dto = {};

      // Act
      const result = await service.update('1', dto);

      // Assert
      expect(mockInterviewFindService.findById).toHaveBeenCalledWith('1');
      expect(mockPrisma.interview.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {},
        include: {
          profileInterviews: {
            orderBy: { startDate: 'desc' },
          },
        },
      });
      expect(result).toEqual(existingInterview);
    });

    it('should throw NotFoundException when interview not found', async () => {
      // Arrange
      mockInterviewFindService.findById.mockRejectedValue(new NotFoundException('Not found'));

      // Act
      const promise = service.update('999', { stepId: 's1' });

      // Assert
      await expect(promise).rejects.toThrow(NotFoundException);
      expect(mockPrisma.interview.update).not.toHaveBeenCalled();
    });
  });
});