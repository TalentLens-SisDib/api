import { ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { Test, TestingModule } from '@nestjs/testing';
import { StepCreationService } from '../step-creation.service.js';
import { StepFindService } from '../step-find.service.js';

const mockPrisma = {
  step: {
    create: vi.fn(),
  },
};

const mockStepFindService = {
  findByJobOpeningAndOrder: vi.fn(),
};

describe('StepCreationService', () => {
  let service: StepCreationService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StepCreationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StepFindService, useValue: mockStepFindService },
      ],
    }).compile();

    service = module.get<StepCreationService>(StepCreationService);
  });

  describe('create', () => {
    it('should create a step when order does not exist', async () => {
      // Arrange
      mockStepFindService.findByJobOpeningAndOrder.mockResolvedValue(null);
      const mockStep = { id: '1', name: 'Step 1', order: 1, jobOpeningId: 'jo1' };
      mockPrisma.step.create.mockResolvedValue(mockStep);
      const dto = { name: 'Step 1', order: 1, description: 'Test' };

      // Act
      const result = await service.create('jo1', dto);

      // Assert
      expect(mockStepFindService.findByJobOpeningAndOrder).toHaveBeenCalledWith('jo1', 1);
      expect(mockPrisma.step.create).toHaveBeenCalledWith({
        data: { ...dto, jobOpeningId: 'jo1' },
      });
      expect(result).toEqual(mockStep);
    });

    it('should throw error when step with same order already exists', async () => {
      // Arrange
      mockStepFindService.findByJobOpeningAndOrder.mockResolvedValue({ id: '2', order: 1 });
      const dto = { name: 'Step 1', order: 1 };

      // Act
      const promise = service.create('jo1', dto);

      // Assert
      await expect(promise).rejects.toThrow(ConflictException);
      await expect(promise).rejects.toThrow('Step with order 1 already exists for this job opening');
      expect(mockPrisma.step.create).not.toHaveBeenCalled();
    });
  });
});