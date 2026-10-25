import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from '../ai.service.js';
import { generateProfile } from '../ai.provider.js';
import { getAiConfig } from '../ai.config.js';

vi.mock('../ai.config.js', () => ({
  getAiConfig: vi.fn(() => ({
    provider: 'openai',
    model: 'gpt-4',
    apiKey: 'test-key',
    baseUrl: 'https://api.openai.com/v1',
    timeoutMs: 60000,
  })),
}));

vi.mock('../ai.provider.js', () => ({
  generateProfile: vi.fn(),
}));

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiService],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  const createMockPdfFile = (originalname: string, buffer?: Buffer): Express.Multer.File => ({
    originalname,
    mimetype: 'application/pdf',
    buffer: buffer || Buffer.from('%PDF-1.4\n% mock pdf content'),
  } as Express.Multer.File);

  describe('parsePdf', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should parse PDF and return CreateProfileDto with extracted name', async () => {
      // Arrange
      const mockFile = createMockPdfFile('john_doe_resume.pdf');
      
      // Mock the private extractText method
      const mockExtractText = vi.fn().mockResolvedValue('Mock CV text content');
      (service as any).extractText = mockExtractText;
      
      // Mock the generateProfile function
      vi.mocked(generateProfile).mockResolvedValue(JSON.stringify({
        name: 'john_doe_resume',
        description: 'Profile created from CV: john_doe_resume.pdf',
        skills: ['TypeScript', 'React', 'Node.js'],
      }));

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
      const mockFile = createMockPdfFile('resume');
      
      // Mock the private extractText method
      const mockExtractText = vi.fn().mockResolvedValue('Mock CV text content');
      (service as any).extractText = mockExtractText;
      
      // Mock the generateProfile function
      vi.mocked(generateProfile).mockResolvedValue(JSON.stringify({
        name: 'resume',
        description: 'Profile created from CV: resume',
        skills: ['TypeScript', 'React', 'Node.js'],
      }));

      // Act
      const result = await service.parsePdf(mockFile);

      // Assert
      expect(result.name).toBe('resume');
      expect(result.description).toBe('Profile created from CV: resume');
    });

    it('should return skills array with mock skills', async () => {
      // Arrange
      const mockFile = createMockPdfFile('test.pdf');
      
      // Mock the private extractText method
      const mockExtractText = vi.fn().mockResolvedValue('Mock CV text content');
      (service as any).extractText = mockExtractText;
      
      // Mock the generateProfile function
      vi.mocked(generateProfile).mockResolvedValue(JSON.stringify({
        name: 'test',
        description: 'Profile created from CV: test.pdf',
        skills: ['TypeScript', 'React', 'Node.js'],
      }));

      // Act
      const result = await service.parsePdf(mockFile);

      // Assert
      expect(result.skills).toEqual(['TypeScript', 'React', 'Node.js']);
    });
  });
});