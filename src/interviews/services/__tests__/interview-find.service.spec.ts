import { PrismaService } from '../../../prisma/prisma.service.js';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InterviewFindService } from '../interview-find.service.js';

const mockPrisma = {
  interview: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
};

describe('InterviewFindService', () => {
  let service: InterviewFindService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewFindService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<InterviewFindService>(InterviewFindService);
  });

  describe('findAll', () => {
    it('should return all interviews when no filters', async () => {
      // Arrange
      const mockInterviews = [
        { id: '1', stepId: 's1', userId: 1, transcript: 'Test 1', keyTakeaways: '[]' },
        { id: '2', stepId: 's2', userId: 2, transcript: 'Test 2', keyTakeaways: '[]' },
      ];
      mockPrisma.interview.findMany.mockResolvedValue(mockInterviews);

      // Act
      const result = await service.findAll();

      // Assert
      expect(mockPrisma.interview.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockInterviews);
    });

    it('should filter by stepId', async () => {
      // Arrange
      const mockInterviews = [{ id: '1', stepId: 's1', userId: 1, transcript: 'Test 1', keyTakeaways: '[]' }];
      mockPrisma.interview.findMany.mockResolvedValue(mockInterviews);

      // Act
      const result = await service.findAll('s1');

      // Assert
      expect(mockPrisma.interview.findMany).toHaveBeenCalledWith({
        where: { stepId: 's1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockInterviews);
    });

    it('should filter by userId', async () => {
      // Arrange
      const mockInterviews = [{ id: '1', stepId: 's1', userId: 1, transcript: 'Test 1', keyTakeaways: '[]' }];
      mockPrisma.interview.findMany.mockResolvedValue(mockInterviews);

      // Act
      const result = await service.findAll(undefined, 1);

      // Assert
      expect(mockPrisma.interview.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockInterviews);
    });

    it('should filter by both stepId and userId', async () => {
      // Arrange
      const mockInterviews = [{ id: '1', stepId: 's1', userId: 1, transcript: 'Test 1', keyTakeaways: '[]' }];
      mockPrisma.interview.findMany.mockResolvedValue(mockInterviews);

      // Act
      const result = await service.findAll('s1', 1);

      // Assert
      expect(mockPrisma.interview.findMany).toHaveBeenCalledWith({
        where: { stepId: 's1', userId: 1 },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockInterviews);
    });
  });

  describe('findById', () => {
    it('should return interview when found', async () => {
      // Arrange
      const mockInterview = { id: '1', stepId: 's1', userId: 1, transcript: 'Test', keyTakeaways: '[]' };
      mockPrisma.interview.findUnique.mockResolvedValue(mockInterview);

      // Act
      const result = await service.findById('1');

      // Assert
      expect(mockPrisma.interview.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toEqual(mockInterview);
    });

    it('should throw NotFoundException when interview not found', async () => {
      // Arrange
      mockPrisma.interview.findUnique.mockResolvedValue(null);

      // Act
      const promise = service.findById('999');

      // Assert
      await expect(promise).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByUserAndStep', () => {
    it('should return interview when found', async () => {
      // Arrange
      const mockInterview = { id: '1', stepId: 's1', userId: 1, transcript: 'Test', keyTakeaways: '[]' };
      mockPrisma.interview.findUnique.mockResolvedValue(mockInterview);

      // Act
      const result = await service.findByUserAndStep(1, 's1');

      // Assert
      expect(mockPrisma.interview.findUnique).toHaveBeenCalledWith({
        where: { userId_stepId: { userId: 1, stepId: 's1' } },
      });
      expect(result).toEqual(mockInterview);
    });

    it('should return null when not found', async () => {
      // Arrange
      mockPrisma.interview.findUnique.mockResolvedValue(null);

      // Act
      const result = await service.findByUserAndStep(1, 's1');

      // Assert
      expect(result).toBeNull();
    });
  });
});