import { Injectable } from '@nestjs/common';
import { Interview } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateInterviewDto } from '../dto/create-interview.dto.js';
import { InterviewFindService } from './interview-find.service.js';

@Injectable()
export class InterviewCreationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly interviewFindService: InterviewFindService,
  ) {}

  async create(userId: number, stepId: string, dto: CreateInterviewDto): Promise<Interview> {
    const existing = await this.interviewFindService.findByUserAndStep(userId, stepId);
    if (existing) {
      throw new Error('Interview already exists for this user and step');
    }

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