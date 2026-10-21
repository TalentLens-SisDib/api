import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { InterviewFindService } from './interview-find.service.js';

@Injectable()
export class InterviewDeleteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly interviewFindService: InterviewFindService,
  ) {}

  async remove(id: string): Promise<void> {
    await this.interviewFindService.findById(id);
    await this.prisma.interview.delete({ where: { id } });
  }
}