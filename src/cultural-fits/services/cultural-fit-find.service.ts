import { Injectable } from '@nestjs/common';
import { CulturalFit } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class CulturalFitFindService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<CulturalFit[]> {
    return this.prisma.culturalFit.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
