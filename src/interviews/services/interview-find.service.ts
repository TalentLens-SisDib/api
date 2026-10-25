import { Injectable, NotFoundException } from '@nestjs/common';
import { Interview, ProfileInterview } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

export type InterviewWithRelations = Interview & {
  profileInterviews: ProfileInterview[];
};

@Injectable()
export class InterviewFindService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(stepId?: string, userId?: number): Promise<InterviewWithRelations[]> {
    return this.prisma.interview.findMany({
      where: {
        ...(stepId ? { stepId } : {}),
        ...(userId ? { userId } : {}),
      },
      include: {
        profileInterviews: {
          orderBy: { startDate: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<InterviewWithRelations> {
    const interview = await this.prisma.interview.findUnique({
      where: { id },
      include: {
        profileInterviews: {
          orderBy: { startDate: 'desc' },
        },
      },
    });
    if (!interview) {
      throw new NotFoundException(`Interview with id ${id} not found`);
    }
    return interview;
  }
}
