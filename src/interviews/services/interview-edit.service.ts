import { Injectable } from '@nestjs/common';
import { Prisma, Interview } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UpdateInterviewDto } from '../dto/update-interview.dto.js';
import { InterviewFindService } from './interview-find.service.js';

@Injectable()
export class InterviewEditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly interviewFindService: InterviewFindService,
  ) {}

  async update(id: string, dto: UpdateInterviewDto): Promise<Interview> {
    await this.interviewFindService.findById(id);

    const updateData: Prisma.InterviewUpdateInput = {};
    if (dto.stepId !== undefined) {
      updateData.step = { connect: { id: dto.stepId } };
    }

    return this.prisma.interview.update({
      where: { id },
      data: updateData,
    });
  }
}