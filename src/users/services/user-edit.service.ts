import { ConflictException, Injectable } from '@nestjs/common';
import { AuthPayload } from '../../auth/auth-payload.js';
import { hashPassword } from '../../common/password.js';
import { Prisma, User } from '../../generated/prisma/client.js';
import { isUniqueConstraintViolation } from '../../prisma/prisma-error.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UpdateUserDto } from '../dto/update-user.dto.js';
import { assertCanManageUser } from '../user-access.js';
import { UserFindService } from './user-find.service.js';

@Injectable()
export class UserEditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userFindService: UserFindService,
  ) {}

  async update(
    requester: AuthPayload,
    id: number,
    dto: UpdateUserDto,
  ): Promise<User> {
    const target = await this.userFindService.findById(id);
    assertCanManageUser(requester, target);

    const data: Prisma.UserUncheckedUpdateInput = {};

    if (dto.email !== undefined) {
      data.email = dto.email;
    }

    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    if (dto.role !== undefined) {
      data.role = dto.role;
    }

    if (dto.password !== undefined) {
      data.password = await hashPassword(dto.password);
    }

    try {
      return await this.prisma.user.update({ where: { id }, data });
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException('A user with this email already exists');
      }

      throw error;
    }
  }
}
