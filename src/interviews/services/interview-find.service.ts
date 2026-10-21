import { Injectable, NotFoundException } from '@nestjs/common';
import { Interview } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class InterviewFindService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(stepId?: string, userId?: number): Promise<Interview[]> {
    return this.prisma.interview.findMany({
      where: {
        ...(stepId ? { stepId } : {}),
        ...(userId ? { userId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Interview> {
    const interview = await this.prisma.interview.findUnique({
      where: { id },
    });
    if (!interview) {
      throw new NotFoundException(`Interview with id ${id} not found`);
    }
    return interview;
  }

  async findByUserAndStep(userId: number, stepId: string): Promise<Interview | null> {
    return this.prisma.interview.findUnique({
      where: { userId_stepId: { userId, stepId } },
    });
  }
}