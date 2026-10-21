import { PrismaService } from '../../../prisma/prisma.service.js';
import { Test, TestingModule } from '@nestjs/testing';
import { InterviewDeleteService } from '../interview-delete.service.js';
import { InterviewFindService } from '../interview-find.service.js';

const mockPrisma = {
  interview: {
    delete: vi.fn(),
  },
};

const mockInterviewFindService = {
  findById: vi.fn(),
};

describe('InterviewDeleteService', () => {
  let service: InterviewDeleteService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewDeleteService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: InterviewFindService, useValue: mockInterviewFindService },
      ],
    }).compile();

    service = module.get<InterviewDeleteService>(InterviewDeleteService);
  });

  describe('remove', () => {
    it('should delete an interview when found', async () => {
      // Arrange
      mockInterviewFindService.findById.mockResolvedValue({ id: '1' });
      mockPrisma.interview.delete.mockResolvedValue({ id: '1' });

      // Act
      await service.remove('1');

      // Assert
      expect(mockInterviewFindService.findById).toHaveBeenCalledWith('1');
      expect(mockPrisma.interview.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should throw NotFoundException when interview not found', async () => {
      // Arrange
      mockInterviewFindService.findById.mockRejectedValue(new Error('Not found'));

      // Act
      const promise = service.remove('999');

      // Assert
      await expect(promise).rejects.toThrow();
      expect(mockPrisma.interview.delete).not.toHaveBeenCalled();
    });
  });
});