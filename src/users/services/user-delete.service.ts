import { Injectable, NotFoundException } from '@nestjs/common';
import { isRecordNotFound } from '../../prisma/prisma-error.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class UserDeleteService {
  constructor(private readonly prisma: PrismaService) {}

  async remove(id: number): Promise<void> {
    try {
      await this.prisma.user.delete({ where: { id } });
    } catch (error) {
      if (isRecordNotFound(error)) {
        throw new NotFoundException(`User with id ${id} not found`);
      }

      throw error;
    }
  }
}
