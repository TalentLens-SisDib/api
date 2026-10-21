import { PrismaService } from '../../../prisma/prisma.service.js';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { StepFindService } from '../step-find.service.js';

const mockPrisma = {
  step: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
};

describe('StepFindService', () => {
  let service: StepFindService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StepFindService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<StepFindService>(StepFindService);
  });

  describe('findAll', () => {
    it('should return all steps when no jobOpeningId provided', async () => {
      // Arrange
      const mockSteps = [
        { id: '1', name: 'Step 1', order: 1, jobOpeningId: 'jo1' },
        { id: '2', name: 'Step 2', order: 2, jobOpeningId: 'jo1' },
      ];
      mockPrisma.step.findMany.mockResolvedValue(mockSteps);

      // Act
      const result = await service.findAll();

      // Assert
      expect(mockPrisma.step.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: { order: 'asc' },
      });
      expect(result).toEqual(mockSteps);
    });

    it('should return steps filtered by jobOpeningId', async () => {
      // Arrange
      const mockSteps = [{ id: '1', name: 'Step 1', order: 1, jobOpeningId: 'jo1' }];
      mockPrisma.step.findMany.mockResolvedValue(mockSteps);

      // Act
      const result = await service.findAll('jo1');

      // Assert
      expect(mockPrisma.step.findMany).toHaveBeenCalledWith({
        where: { jobOpeningId: 'jo1' },
        orderBy: { order: 'asc' },
      });
      expect(result).toEqual(mockSteps);
    });
  });

  describe('findById', () => {
    it('should return step when found', async () => {
      // Arrange
      const mockStep = { id: '1', name: 'Step 1', order: 1, jobOpeningId: 'jo1' };
      mockPrisma.step.findUnique.mockResolvedValue(mockStep);

      // Act
      const result = await service.findById('1');

      // Assert
      expect(mockPrisma.step.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toEqual(mockStep);
    });

    it('should throw NotFoundException when step not found', async () => {
      // Arrange
      mockPrisma.step.findUnique.mockResolvedValue(null);

      // Act
      const promise = service.findById('999');

      // Assert
      await expect(promise).rejects.toThrow(NotFoundException);
      expect(mockPrisma.step.findUnique).toHaveBeenCalledWith({ where: { id: '999' } });
    });
  });

  describe('findByIdWithInterviews', () => {
    it('should return step with interviews when found', async () => {
      // Arrange
      const mockStep = { id: '1', name: 'Step 1', interviews: [{ id: 'i1' }] };
      mockPrisma.step.findUnique.mockResolvedValue(mockStep);

      // Act
      const result = await service.findByIdWithInterviews('1');

      // Assert
      expect(mockPrisma.step.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { interviews: true },
      });
      expect(result).toEqual(mockStep);
    });

    it('should throw NotFoundException when step not found', async () => {
      // Arrange
      mockPrisma.step.findUnique.mockResolvedValue(null);

      // Act
      const promise = service.findByIdWithInterviews('999');

      // Assert
      await expect(promise).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByJobOpeningAndOrder', () => {
    it('should return step when found', async () => {
      // Arrange
      const mockStep = { id: '1', name: 'Step 1', order: 1, jobOpeningId: 'jo1' };
      mockPrisma.step.findUnique.mockResolvedValue(mockStep);

      // Act
      const result = await service.findByJobOpeningAndOrder('jo1', 1);

      // Assert
      expect(mockPrisma.step.findUnique).toHaveBeenCalledWith({
        where: { jobOpeningId_order: { jobOpeningId: 'jo1', order: 1 } },
      });
      expect(result).toEqual(mockStep);
    });

    it('should return null when not found', async () => {
      // Arrange
      mockPrisma.step.findUnique.mockResolvedValue(null);

      // Act
      const result = await service.findByJobOpeningAndOrder('jo1', 999);

      // Assert
      expect(result).toBeNull();
    });
  });
});