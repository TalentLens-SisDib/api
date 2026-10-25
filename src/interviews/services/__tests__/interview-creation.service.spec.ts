import { PrismaService } from '../../../prisma/prisma.service.js';
import { Test, TestingModule } from '@nestjs/testing';
import { InterviewCreationService } from '../interview-creation.service.js';

const mockPrisma = {
  interview: {
    create: vi.fn(),
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
      const mockInterview = { id: '1', stepId: 's1', userId: 1, transcript: 'Test', keyTakeaways: '["takeaway"]' };
      mockPrisma.interview.create.mockResolvedValue(mockInterview);
      const dto = { transcript: 'Test', keyTakeaways: ['takeaway'] };

      // Act
      const result = await service.create(1, 's1', dto);

      // Assert
      expect(mockPrisma.interview.create).toHaveBeenCalledWith({
        data: { transcript: 'Test', keyTakeaways: '["takeaway"]', userId: 1, stepId: 's1' },
      });
      expect(result).toEqual(mockInterview);
    });

    it('should create interview with empty keyTakeaways when not provided', async () => {
      // Arrange
      const mockInterview = { id: '1', stepId: 's1', userId: 1, transcript: 'Test', keyTakeaways: '[]' };
      mockPrisma.interview.create.mockResolvedValue(mockInterview);
      const dto = { transcript: 'Test' };

      // Act
      const result = await service.create(1, 's1', dto);

      // Assert
      expect(mockPrisma.interview.create).toHaveBeenCalledWith({
        data: { transcript: 'Test', keyTakeaways: '[]', userId: 1, stepId: 's1' },
      });
      expect(result).toEqual(mockInterview);
    });

    it('should allow multiple interviews for the same user and step', async () => {
      // Arrange
      const first = { id: '1', stepId: 's1', userId: 1, transcript: 'First', keyTakeaways: '[]' };
      const second = { id: '2', stepId: 's1', userId: 1, transcript: 'Second', keyTakeaways: '[]' };
      mockPrisma.interview.create.mockResolvedValueOnce(first).mockResolvedValueOnce(second);

      // Act
      const firstResult = await service.create(1, 's1', { transcript: 'First' });
      const secondResult = await service.create(1, 's1', { transcript: 'Second' });

      // Assert
      expect(mockPrisma.interview.create).toHaveBeenCalledTimes(2);
      expect([firstResult, secondResult]).toEqual([first, second]);
    });
  });
});
