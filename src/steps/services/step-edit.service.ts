import { ConflictException, Injectable } from '@nestjs/common';
import { Step } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UpdateStepDto } from '../dto/update-step.dto.js';
import { StepFindService } from './step-find.service.js';

@Injectable()
export class StepEditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stepFindService: StepFindService,
  ) {}

  async update(id: string, dto: UpdateStepDto): Promise<Step> {
    await this.stepFindService.findById(id);

    if (dto.order !== undefined) {
      const step = await this.stepFindService.findById(id);
      const existingStep = await this.stepFindService.findByJobOpeningAndOrder(step.jobOpeningId, dto.order);
      if (existingStep && existingStep.id !== id) {
        throw new ConflictException(`Step with order ${dto.order} already exists for this job opening`);
      }
    }

    return this.prisma.step.update({
      where: { id },
      data: dto,
    });
  }
}