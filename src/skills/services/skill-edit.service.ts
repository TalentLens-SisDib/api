import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma, Skill } from '../../generated/prisma/client.js';
import { isUniqueConstraintViolation } from '../../prisma/prisma-error.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UpdateSkillDto } from '../dto/update-skill.dto.js';
import { SkillFindService } from './skill-find.service.js';

@Injectable()
export class SkillEditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly skillFindService: SkillFindService,
  ) {}

  async update(id: string, dto: UpdateSkillDto): Promise<Skill> {
    await this.skillFindService.findById(id);

    const data: Prisma.SkillUncheckedUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    if (dto.description !== undefined) {
      data.description = dto.description;
    }

    try {
      return await this.prisma.skill.update({ where: { id }, data });
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException('A skill with this name already exists');
      }

      throw error;
    }
  }
}