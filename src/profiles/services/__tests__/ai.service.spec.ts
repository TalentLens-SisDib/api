import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from '../ai.service.js';

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiService],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  describe('parsePdf', () => {
    it('should parse PDF and return CreateProfileDto with extracted name', async () => {
      // Arrange
      const mockFile = {
        originalname: 'john_doe_resume.pdf',
      } as Express.Multer.File;

      // Act
      const result = await service.parsePdf(mockFile);

      // Assert
      expect(result).toEqual({
        name: 'john_doe_resume',
        description: 'Profile created from CV: john_doe_resume.pdf',
        skills: ['TypeScript', 'React', 'Node.js'],
      });
    });

    it('should handle file without .pdf extension', async () => {
      // Arrange
      const mockFile = {
        originalname: 'resume',
      } as Express.Multer.File;

      // Act
      const result = await service.parsePdf(mockFile);

      // Assert
      expect(result.name).toBe('resume');
      expect(result.description).toBe('Profile created from CV: resume');
    });

    it('should return skills array with mock skills', async () => {
      // Arrange
      const mockFile = {
        originalname: 'test.pdf',
      } as Express.Multer.File;

      // Act
      const result = await service.parsePdf(mockFile);

      // Assert
      expect(result.skills).toEqual(['TypeScript', 'React', 'Node.js']);
    });
  });
});