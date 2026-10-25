import { Injectable } from '@nestjs/common';
import { Interview } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateInterviewDto } from '../dto/create-interview.dto.js';

@Injectable()
export class InterviewCreationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, stepId: string, dto: CreateInterviewDto): Promise<Interview> {
    return this.prisma.interview.create({
      data: {
        transcript: dto.transcript,
        keyTakeaways: JSON.stringify(dto.keyTakeaways || []),
        userId,
        stepId,
      },
    });
  }
}
