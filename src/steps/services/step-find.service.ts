import { Injectable, NotFoundException } from '@nestjs/common';
import { Step } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class StepFindService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(jobOpeningId?: string): Promise<Step[]> {
    return this.prisma.step.findMany({
      where: jobOpeningId ? { jobOpeningId } : undefined,
      orderBy: { order: 'asc' },
    });
  }

  async findById(id: string): Promise<Step> {
    const step = await this.prisma.step.findUnique({
      where: { id },
    });
    if (!step) {
      throw new NotFoundException(`Step with id ${id} not found`);
    }
    return step;
  }

  async findByIdWithInterviews(id: string): Promise<Step & { interviews: any[] }> {
    const step = await this.prisma.step.findUnique({
      where: { id },
      include: { interviews: true },
    });
    if (!step) {
      throw new NotFoundException(`Step with id ${id} not found`);
    }
    return step;
  }

  async findByJobOpeningAndOrder(jobOpeningId: string, order: number): Promise<Step | null> {
    return this.prisma.step.findUnique({
      where: { jobOpeningId_order: { jobOpeningId, order } },
    });
  }
}