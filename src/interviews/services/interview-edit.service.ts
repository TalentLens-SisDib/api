import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { InterviewFindService, InterviewWithRelations } from './interview-find.service.js';

@Injectable()
export class InterviewEditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly interviewFindService: InterviewFindService,
  ) {}

  async update(id: string): Promise<InterviewWithRelations> {
    await this.interviewFindService.findById(id);

    return this.prisma.interview.update({
      where: { id },
      data: { updatedAt: new Date() },
      include: {
        profileInterviews: {
          orderBy: { startDate: 'desc' },
        },
      },
    });
  }
}
