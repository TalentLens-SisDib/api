import { Injectable, NotFoundException } from '@nestjs/common';
import { Skill } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class SkillFindService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Skill[]> {
    return this.prisma.skill.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<Skill> {
    const skill = await this.prisma.skill.findUnique({ where: { id } });

    if (skill === null) {
      throw new NotFoundException(`Skill with id ${id} not found`);
    }

    return skill;
  }

  findByName(name: string): Promise<Skill | null> {
    return this.prisma.skill.findFirst({ where: { name } });
  }
}