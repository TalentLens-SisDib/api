import { ConflictException, Injectable } from '@nestjs/common';
import { Skill } from '../../generated/prisma/client.js';
import { isUniqueConstraintViolation } from '../../prisma/prisma-error.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateSkillDto } from '../dto/create-skill.dto.js';

@Injectable()
export class SkillCreationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSkillDto): Promise<Skill> {
    try {
      return await this.prisma.skill.create({
        data: {
          name: dto.name,
          description: dto.description,
        },
      });
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException('A skill with this name already exists');
      }

      throw error;
    }
  }
}