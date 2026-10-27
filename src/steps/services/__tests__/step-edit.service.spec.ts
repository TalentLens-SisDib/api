import { ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { Test, TestingModule } from '@nestjs/testing';
import { StepEditService } from '../step-edit.service.js';
import { StepFindService } from '../step-find.service.js';

const mockPrisma = {
  step: {
    update: vi.fn(),
    findUnique: vi.fn(),
  },
};

const mockStepFindService = {
  findById: vi.fn(),
  findByJobOpeningAndOrder: vi.fn(),
};

describe('StepEditService', () => {
  let service: StepEditService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StepEditService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StepFindService, useValue: mockStepFindService },
      ],
    }).compile();

    service = module.get<StepEditService>(StepEditService);
  });

  describe('update', () => {
    it('should update a step when order is not changed', async () => {
      // Arrange
      const existingStep = { id: '1', name: 'Step 1', order: 1, jobOpeningId: 'jo1' };
      const updatedStep = { ...existingStep, name: 'Updated Step' };
      mockStepFindService.findById.mockResolvedValue(existingStep);
      mockPrisma.step.update.mockResolvedValue(updatedStep);
      const dto = { name: 'Updated Step' };

      // Act
      const result = await service.update('1', dto);

      // Assert
      expect(mockStepFindService.findById).toHaveBeenCalledWith('1');
      expect(mockStepFindService.findByJobOpeningAndOrder).not.toHaveBeenCalled();
      expect(mockPrisma.step.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: dto,
      });
      expect(result).toEqual(updatedStep);
    });

    it('should update a step when order is changed to a new unique order', async () => {
      // Arrange
      const existingStep = { id: '1', name: 'Step 1', order: 1, jobOpeningId: 'jo1' };
      const updatedStep = { ...existingStep, order: 2 };
      mockStepFindService.findById.mockResolvedValue(existingStep);
      mockStepFindService.findByJobOpeningAndOrder.mockResolvedValue(null);
      mockPrisma.step.update.mockResolvedValue(updatedStep);
      const dto = { order: 2 };

      // Act
      const result = await service.update('1', dto);

      // Assert
      expect(mockStepFindService.findByJobOpeningAndOrder).toHaveBeenCalledWith('jo1', 2);
      expect(mockPrisma.step.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: dto,
      });
      expect(result).toEqual(updatedStep);
    });

    it('should throw error when new order already exists for another step', async () => {
      // Arrange
      const existingStep = { id: '1', name: 'Step 1', order: 1, jobOpeningId: 'jo1' };
      const otherStep = { id: '2', name: 'Step 2', order: 2, jobOpeningId: 'jo1' };
      mockStepFindService.findById.mockResolvedValue(existingStep);
      mockStepFindService.findByJobOpeningAndOrder.mockResolvedValue(otherStep);
      const dto = { order: 2 };

      // Act
      const promise = service.update('1', dto);

      // Assert
      await expect(promise).rejects.toThrow(ConflictException);
      await expect(promise).rejects.toThrow('Step with order 2 already exists for this job opening');
      expect(mockPrisma.step.update).not.toHaveBeenCalled();
    });

    it('should allow updating to same order', async () => {
      // Arrange
      const existingStep = { id: '1', name: 'Step 1', order: 1, jobOpeningId: 'jo1' };
      const updatedStep = { ...existingStep, name: 'Updated' };
      mockStepFindService.findById.mockResolvedValue(existingStep);
      mockStepFindService.findByJobOpeningAndOrder.mockResolvedValue(existingStep);
      mockPrisma.step.update.mockResolvedValue(updatedStep);
      const dto = { order: 1, name: 'Updated' };

      // Act
      const result = await service.update('1', dto);

      // Assert
      expect(mockPrisma.step.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: dto,
      });
      expect(result).toEqual(updatedStep);
    });
  });
});