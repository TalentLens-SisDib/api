import { PrismaService } from '../../../prisma/prisma.service.js';
import { Test, TestingModule } from '@nestjs/testing';
import { InterviewEditService } from '../interview-edit.service.js';
import { InterviewFindService } from '../interview-find.service.js';

const mockPrisma = {
  interview: {
    update: vi.fn(),
    findUnique: vi.fn(),
  },
};

const mockInterviewFindService = {
  findById: vi.fn(),
};

describe('InterviewEditService', () => {
  let service: InterviewEditService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewEditService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: InterviewFindService, useValue: mockInterviewFindService },
      ],
    }).compile();

    service = module.get<InterviewEditService>(InterviewEditService);
  });

  describe('update', () => {
    it('should update transcript only', async () => {
      // Arrange
      const existingInterview = { id: '1', transcript: 'Old', keyTakeaways: '[]' };
      const updatedInterview = { ...existingInterview, transcript: 'New' };
      mockInterviewFindService.findById.mockResolvedValue(existingInterview);
      mockPrisma.interview.update.mockResolvedValue(updatedInterview);
      const dto = { transcript: 'New' };

      // Act
      const result = await service.update('1', dto);

      // Assert
      expect(mockInterviewFindService.findById).toHaveBeenCalledWith('1');
      expect(mockPrisma.interview.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { transcript: 'New' },
      });
      expect(result).toEqual(updatedInterview);
    });

    it('should update keyTakeaways only', async () => {
      // Arrange
      const existingInterview = { id: '1', transcript: 'Test', keyTakeaways: '[]' };
      const updatedInterview = { ...existingInterview, keyTakeaways: '["new"]' };
      mockInterviewFindService.findById.mockResolvedValue(existingInterview);
      mockPrisma.interview.update.mockResolvedValue(updatedInterview);
      const dto = { keyTakeaways: ['new'] };

      // Act
      const result = await service.update('1', dto);

      // Assert
      expect(mockPrisma.interview.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { keyTakeaways: '["new"]' },
      });
      expect(result).toEqual(updatedInterview);
    });

    it('should update both transcript and keyTakeaways', async () => {
      // Arrange
      const existingInterview = { id: '1', transcript: 'Old', keyTakeaways: '[]' };
      const updatedInterview = { ...existingInterview, transcript: 'New', keyTakeaways: '["takeaway"]' };
      mockInterviewFindService.findById.mockResolvedValue(existingInterview);
      mockPrisma.interview.update.mockResolvedValue(updatedInterview);
      const dto = { transcript: 'New', keyTakeaways: ['takeaway'] };

      // Act
      const result = await service.update('1', dto);

      // Assert
      expect(mockPrisma.interview.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { transcript: 'New', keyTakeaways: '["takeaway"]' },
      });
      expect(result).toEqual(updatedInterview);
    });

    it('should throw NotFoundException when interview not found', async () => {
      // Arrange
      mockInterviewFindService.findById.mockRejectedValue(new Error('Not found'));

      // Act
      const promise = service.update('999', { transcript: 'Test' });

      // Assert
      await expect(promise).rejects.toThrow();
      expect(mockPrisma.interview.update).not.toHaveBeenCalled();
    });
  });
});