import { ConflictException, Injectable } from '@nestjs/common';
import { CulturalFit } from '../../generated/prisma/client.js';
import { isUniqueConstraintViolation } from '../../prisma/prisma-error.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateCulturalFitDto } from '../dto/create-cultural-fit.dto.js';

@Injectable()
export class CulturalFitCreationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCulturalFitDto): Promise<CulturalFit> {
    try {
      return await this.prisma.culturalFit.create({
        data: {
          name: dto.name,
          description: dto.description,
        },
      });
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException('A cultural fit with this name already exists');
      }

      throw error;
    }
  }
}
