import { ConflictException, Injectable } from '@nestjs/common';
import { hashPassword } from '../../common/password.js';
import { AuthPayload } from '../../auth/auth-payload.js';
import { Role, User } from '../../generated/prisma/client.js';
import { isUniqueConstraintViolation } from '../../prisma/prisma-error.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateUserDto } from '../dto/create-user.dto.js';

@Injectable()
export class UserCreationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(requester: AuthPayload, dto: CreateUserDto): Promise<User> {
    const password = await hashPassword(dto.password);

    try {
      return await this.prisma.user.create({
        data: {
          email: dto.email,
          name: dto.name ?? '',
          password,
          role: dto.role ?? Role.Recruiter,
          companyId: requester.companyId,
        },
      });
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException('A user with this email already exists');
      }

      throw error;
    }
  }
}
