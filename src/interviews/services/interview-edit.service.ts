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
    if (dto.transcript !== undefined) {
      updateData.transcript = dto.transcript;
    }
    if (dto.keyTakeaways !== undefined) {
      updateData.keyTakeaways = JSON.stringify(dto.keyTakeaways);
    }

    return this.prisma.interview.update({
      where: { id },
      data: updateData,
    });
  }
}