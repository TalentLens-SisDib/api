import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthPayload } from '../../auth/auth-payload.js';
import { isRecordNotFound } from '../../prisma/prisma-error.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { assertCanManageUser } from '../user-access.js';
import { UserFindService } from './user-find.service.js';

@Injectable()
export class UserDeleteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userFindService: UserFindService,
  ) {}

  async remove(requester: AuthPayload, id: number): Promise<void> {
    const target = await this.userFindService.findById(id);
    assertCanManageUser(requester, target);

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
