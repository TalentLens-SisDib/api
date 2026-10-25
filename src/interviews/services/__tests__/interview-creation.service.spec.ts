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
      mockInterviewFindService.findByUserAndStep.mockResolvedValue(null);
      const mockInterview = { id: '1', stepId: 's1', userId: 1, createdAt: new Date(), updatedAt: new Date() };
      mockPrisma.interview.create.mockResolvedValue(mockInterview);
      const dto = { stepId: 's1' };

      // Act
      const result = await service.create(1, dto);

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
      mockInterviewFindService.findByUserAndStep.mockResolvedValue({ id: '1' });
      const dto = { stepId: 's1' };

      // Act
      const promise = service.create(1, dto);

      // Assert
      expect(mockPrisma.interview.create).toHaveBeenCalledTimes(2);
      expect([firstResult, secondResult]).toEqual([first, second]);
    });
  });
});
