import { Injectable, NotFoundException } from '@nestjs/common';
import { isRecordNotFound } from '../../prisma/prisma-error.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SkillFindService } from './skill-find.service.js';

@Injectable()
export class SkillDeleteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly skillFindService: SkillFindService,
  ) {}

  async remove(id: string): Promise<void> {
    await this.skillFindService.findById(id);

    try {
      await this.prisma.skill.delete({ where: { id } });
    } catch (error) {
      if (isRecordNotFound(error)) {
        throw new NotFoundException(`Skill with id ${id} not found`);
      }

      throw error;
    }
  }
}