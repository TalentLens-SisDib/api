import { Injectable, NotFoundException } from '@nestjs/common';
import { isRecordNotFound } from '../../prisma/prisma-error.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ProfileFindService } from './profile-find.service.js';

@Injectable()
export class ProfileDeleteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileFindService: ProfileFindService,
  ) {}

  async remove(id: string): Promise<void> {
    await this.profileFindService.findById(id);

    try {
      await this.prisma.applicantProfile.delete({ where: { id } });
    } catch (error) {
      if (isRecordNotFound(error)) {
        throw new NotFoundException(`Profile with id ${id} not found`);
      }

      throw error;
    }
  }
}