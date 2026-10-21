import { PrismaService } from '../../../prisma/prisma.service.js';
import { Test, TestingModule } from '@nestjs/testing';
import { SkillsService } from '../skills.service.js';

const mockPrisma = {
  skill: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
};

const mockTx = {
  skill: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
};

describe('SkillsService', () => {
  let service: SkillsService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkillsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SkillsService>(SkillsService);
  });

  describe('upsertSkills', () => {
    it('should return existing skills when all skills exist', async () => {
      // Arrange
      const existingSkills = [
        { id: '1', name: 'TypeScript' },
        { id: '2', name: 'React' },
      ];
      mockTx.skill.findMany.mockResolvedValue(existingSkills);

      // Act
      const result = await service.upsertSkills(mockTx as any, ['TypeScript', 'React']);

      // Assert
      expect(mockTx.skill.findMany).toHaveBeenCalledWith({
        where: { name: { in: ['TypeScript', 'React'] } },
      });
      expect(mockTx.skill.create).not.toHaveBeenCalled();
      expect(result).toEqual(existingSkills);
    });

    it('should create new skills when they do not exist', async () => {
      // Arrange
      mockTx.skill.findMany.mockResolvedValue([]);
      const createdSkills = [
        { id: '1', name: 'TypeScript' },
        { id: '2', name: 'React' },
      ];
      mockTx.skill.create
        .mockResolvedValueOnce(createdSkills[0])
        .mockResolvedValueOnce(createdSkills[1]);

      // Act
      const result = await service.upsertSkills(mockTx as any, ['TypeScript', 'React']);

      // Assert
      expect(mockTx.skill.findMany).toHaveBeenCalledWith({
        where: { name: { in: ['TypeScript', 'React'] } },
      });
      expect(mockTx.skill.create).toHaveBeenCalledTimes(2);
      expect(result).toEqual(createdSkills);
    });

    it('should mix existing and new skills', async () => {
      // Arrange
      const existingSkills = [{ id: '1', name: 'TypeScript' }];
      mockTx.skill.findMany.mockResolvedValue(existingSkills);
      const newSkill = { id: '2', name: 'React' };
      mockTx.skill.create.mockResolvedValue(newSkill);

      // Act
      const result = await service.upsertSkills(mockTx as any, ['TypeScript', 'React']);

      // Assert
      expect(mockTx.skill.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual([...existingSkills, newSkill]);
    });

    it('should deduplicate and trim skill names', async () => {
      // Arrange
      mockTx.skill.findMany.mockResolvedValue([]);
      mockTx.skill.create.mockResolvedValue({ id: '1', name: 'TypeScript' });

      // Act
      await service.upsertSkills(mockTx as any, ['TypeScript', '  TypeScript  ', 'React', '']);

      // Assert
      expect(mockTx.skill.findMany).toHaveBeenCalledWith({
        where: { name: { in: ['TypeScript', 'React'] } },
      });
      expect(mockTx.skill.create).toHaveBeenCalledTimes(2);
    });

    it('should handle empty array', async () => {
      // Act
      const result = await service.upsertSkills(mockTx as any, []);

      // Assert
      expect(mockTx.skill.findMany).toHaveBeenCalledWith({
        where: { name: { in: [] } },
      });
      expect(mockTx.skill.create).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});