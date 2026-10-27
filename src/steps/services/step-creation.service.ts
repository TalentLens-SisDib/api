import { ConflictException, Injectable } from '@nestjs/common';
import { Step } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateStepDto } from '../dto/create-step.dto.js';
import { StepFindService } from './step-find.service.js';

@Injectable()
export class StepCreationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stepFindService: StepFindService,
  ) {}

  async create(jobOpeningId: string, dto: CreateStepDto): Promise<Step> {
    const existingStep = await this.stepFindService.findByJobOpeningAndOrder(jobOpeningId, dto.order);
    if (existingStep) {
      throw new ConflictException(`Step with order ${dto.order} already exists for this job opening`);
    }

    return this.prisma.step.create({
      data: {
        ...dto,
        jobOpeningId,
      },
    });
  }
}