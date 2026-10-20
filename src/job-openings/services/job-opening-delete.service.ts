import { Injectable, NotFoundException } from '@nestjs/common';
import { isRecordNotFound } from '../../prisma/prisma-error.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { JobOpeningFindService } from './job-opening-find.service.js';
import { assertCanManageJobOpening } from '../job-opening-access.js';
import type { AuthPayload } from '../../auth/auth-payload.js';

@Injectable()
export class JobOpeningDeleteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobOpeningFindService: JobOpeningFindService,
  ) {}

  async remove(requester: AuthPayload, id: string): Promise<void> {
    const jobOpening = await this.jobOpeningFindService.findById(id);
    assertCanManageJobOpening(requester, jobOpening);

    try {
      await this.prisma.jobOpening.delete({ where: { id } });
    } catch (error) {
      if (isRecordNotFound(error)) {
        throw new NotFoundException(`Job opening with id ${id} not found`);
      }

      throw error;
    }
  }
}