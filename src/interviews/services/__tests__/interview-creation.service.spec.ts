import { PrismaService } from '../../../prisma/prisma.service.js';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InterviewCreationService } from '../interview-creation.service.js';

const mockPrisma = {
  interview: {
    create: vi.fn(),
  },
  step: {
    findUnique: vi.fn(),
  },
};

describe('InterviewCreationService', () => {
  let service: InterviewCreationService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewCreationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<InterviewCreationService>(InterviewCreationService);
  });

  describe('create', () => {
    it('should create an interview', async () => {
      // Arrange
      mockPrisma.step.findUnique.mockResolvedValue({ id: 's1' });
      const mockInterview = { id: '1', stepId: 's1', userId: 1, profileInterviews: [] };
      mockPrisma.interview.create.mockResolvedValue(mockInterview);

      // Act
      const result = await service.create(1, 's1');

      // Assert
      expect(mockPrisma.interview.create).toHaveBeenCalledWith({
        data: { userId: 1, stepId: 's1' },
        include: {
          profileInterviews: {
            orderBy: { startDate: 'desc' },
          },
        },
      });
      expect(result).toEqual(mockInterview);
    });

    it('should allow multiple interviews for the same user and step', async () => {
      // Arrange
      mockPrisma.step.findUnique.mockResolvedValue({ id: 's1' });
      const first = { id: '1', stepId: 's1', userId: 1, profileInterviews: [] };
      const second = { id: '2', stepId: 's1', userId: 1, profileInterviews: [] };
      mockPrisma.interview.create.mockResolvedValueOnce(first).mockResolvedValueOnce(second);

      // Act
      const firstResult = await service.create(1, 's1');
      const secondResult = await service.create(1, 's1');

      // Assert
      expect(mockPrisma.interview.create).toHaveBeenCalledTimes(2);
      expect([firstResult, secondResult]).toEqual([first, second]);
    });

    it('should throw NotFoundException when the step does not exist', async () => {
      // Arrange
      mockPrisma.step.findUnique.mockResolvedValue(null);

      // Act
      const promise = service.create(1, 'missing');

      // Assert
      await expect(promise).rejects.toThrow(NotFoundException);
      expect(mockPrisma.interview.create).not.toHaveBeenCalled();
    });
  });
});
