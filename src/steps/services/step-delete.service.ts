import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { StepFindService } from './step-find.service.js';

@Injectable()
export class StepDeleteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stepFindService: StepFindService,
  ) {}

  async remove(id: string): Promise<void> {
    await this.stepFindService.findById(id);
    await this.prisma.step.delete({ where: { id } });
  }
}