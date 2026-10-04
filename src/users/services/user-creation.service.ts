import { ConflictException, Injectable } from '@nestjs/common';
import { hashPassword } from '../../common/password.js';
import { Role, User } from '../../generated/prisma/client.js';
import { isUniqueConstraintViolation } from '../../prisma/prisma-error.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateUserDto } from '../dto/create-user.dto.js';
import { UserFindService } from './user-find.service.js';

@Injectable()
export class UserCreationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userFindService: UserFindService,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    await this.userFindService.assertCompanyExists(dto.companyId);

    const password = await hashPassword(dto.password);

    try {
      return await this.prisma.user.create({
        data: {
          email: dto.email,
          name: dto.name ?? '',
          password,
          role: dto.role ?? Role.Recruiter,
          companyId: dto.companyId,
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
