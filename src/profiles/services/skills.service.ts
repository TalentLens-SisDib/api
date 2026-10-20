import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertSkills(
    tx: Prisma.TransactionClient,
    skillNames: string[],
  ): Promise<{ id: string; name: string }[]> {
    const uniqueNames = [...new Set(skillNames.map((s) => s.trim()).filter(Boolean))];

    const existingSkills = await tx.skill.findMany({
      where: { name: { in: uniqueNames } },
    });

    const existingNames = new Set(existingSkills.map((s) => s.name));
    const newNames = uniqueNames.filter((name) => !existingNames.has(name));

    let createdSkills: { id: string; name: string }[] = [];
    if (newNames.length > 0) {
      createdSkills = await Promise.all(
        newNames.map((name) =>
          tx.skill.create({
            data: { name, description: null },
            select: { id: true, name: true },
          }),
        ),
      );
    }

    return [...existingSkills, ...createdSkills];
  }
}