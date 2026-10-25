import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class CulturalFitService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertCulturalFits(
    tx: Prisma.TransactionClient,
    culturalFitNames: string[],
  ): Promise<{ id: string; name: string }[]> {
    const uniqueNames = [...new Set(culturalFitNames.map((s) => s.trim()).filter(Boolean))];

    const existingCulturalFits = await tx.culturalFit.findMany({
      where: { name: { in: uniqueNames } },
    });

    const existingNames = new Set(existingCulturalFits.map((s) => s.name));
    const newNames = uniqueNames.filter((name) => !existingNames.has(name));

    let createdCulturalFits: { id: string; name: string }[] = [];
    if (newNames.length > 0) {
      createdCulturalFits = await Promise.all(
        newNames.map((name) =>
          tx.culturalFit.create({
            data: { name, description: null },
            select: { id: true, name: true },
          }),
        ),
      );
    }

    return [...existingCulturalFits, ...createdCulturalFits];
  }
}