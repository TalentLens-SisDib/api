import { Injectable } from '@nestjs/common';
import { Interview } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateInterviewDto } from '../dto/create-interview.dto.js';
import { InterviewFindService } from './interview-find.service.js';
import { InterviewWithRelations } from './interview-find.service.js';

@Injectable()
export class InterviewCreationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateInterviewDto): Promise<InterviewWithRelations> {
    const existing = await this.interviewFindService.findByUserAndStep(userId, dto.stepId);
    if (existing) {
      throw new Error('Interview already exists for this user and step');
    }

    return this.prisma.interview.create({
      data: {
        userId,
        stepId: dto.stepId,
      },
      include: {
        profileInterviews: {
          orderBy: { startDate: 'desc' },
        },
      },
    });
  }
}
