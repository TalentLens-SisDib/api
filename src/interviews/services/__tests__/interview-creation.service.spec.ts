import { PrismaService } from '../../../prisma/prisma.service.js';
import { Test, TestingModule } from '@nestjs/testing';
import { InterviewCreationService } from '../interview-creation.service.js';
import { InterviewFindService } from '../interview-find.service.js';

const mockPrisma = {
  interview: {
    create: vi.fn(),
  },
};

const mockInterviewFindService = {
  findByUserAndStep: vi.fn(),
};

describe('InterviewCreationService', () => {
  let service: InterviewCreationService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewCreationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: InterviewFindService, useValue: mockInterviewFindService },
      ],
    }).compile();

    service = module.get<InterviewCreationService>(InterviewCreationService);
  });

  describe('create', () => {
    it('should create an interview when none exists for user and step', async () => {
      // Arrange
      mockInterviewFindService.findByUserAndStep.mockResolvedValue(null);
      const mockInterview = { id: '1', stepId: 's1', userId: 1, transcript: 'Test', keyTakeaways: '["takeaway"]' };
      mockPrisma.interview.create.mockResolvedValue(mockInterview);
      const dto = { transcript: 'Test', keyTakeaways: ['takeaway'] };

      // Act
      const result = await service.create(1, 's1', dto);

      // Assert
      expect(mockInterviewFindService.findByUserAndStep).toHaveBeenCalledWith(1, 's1');
      expect(mockPrisma.interview.create).toHaveBeenCalledWith({
        data: { transcript: 'Test', keyTakeaways: '["takeaway"]', userId: 1, stepId: 's1' },
      });
      expect(result).toEqual(mockInterview);
    });

    it('should create interview with empty keyTakeaways when not provided', async () => {
      // Arrange
      mockInterviewFindService.findByUserAndStep.mockResolvedValue(null);
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

    it('should throw error when interview already exists for user and step', async () => {
      // Arrange
      mockInterviewFindService.findByUserAndStep.mockResolvedValue({ id: '1' });
      const dto = { transcript: 'Test' };

      // Act
      const promise = service.create(1, 's1', dto);

      // Assert
      await expect(promise).rejects.toThrow(
        'Interview already exists for this user and step',
      );
      expect(mockPrisma.interview.create).not.toHaveBeenCalled();
    });
  });
});