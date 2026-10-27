import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { InterviewWithRelations } from './interview-find.service.js';

@Injectable()
export class InterviewCreationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, stepId: string): Promise<InterviewWithRelations> {
    const step = await this.prisma.step.findUnique({ where: { id: stepId } });
    if (!step) {
      throw new NotFoundException(`Step with id ${stepId} not found`);
    }

    return this.prisma.interview.create({
      data: { userId, stepId },
      include: {
        profileInterviews: {
          orderBy: { startDate: 'desc' },
        },
      },
    });
  }
}
