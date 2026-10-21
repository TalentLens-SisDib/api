import { PrismaService } from '../../../prisma/prisma.service.js';
import { Test, TestingModule } from '@nestjs/testing';
import { StepDeleteService } from '../step-delete.service.js';
import { StepFindService } from '../step-find.service.js';

const mockPrisma = {
  step: {
    delete: vi.fn(),
  },
};

const mockStepFindService = {
  findById: vi.fn(),
};

describe('StepDeleteService', () => {
  let service: StepDeleteService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StepDeleteService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StepFindService, useValue: mockStepFindService },
      ],
    }).compile();

    service = module.get<StepDeleteService>(StepDeleteService);
  });

  describe('remove', () => {
    it('should delete a step when found', async () => {
      // Arrange
      mockStepFindService.findById.mockResolvedValue({ id: '1', name: 'Step 1' });
      mockPrisma.step.delete.mockResolvedValue({ id: '1' });

      // Act
      await service.remove('1');

      // Assert
      expect(mockStepFindService.findById).toHaveBeenCalledWith('1');
      expect(mockPrisma.step.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should throw NotFoundException when step not found', async () => {
      // Arrange
      mockStepFindService.findById.mockRejectedValue(new Error('Not found'));

      // Act
      const promise = service.remove('999');

      // Assert
      await expect(promise).rejects.toThrow();
      expect(mockPrisma.step.delete).not.toHaveBeenCalled();
    });
  });
});