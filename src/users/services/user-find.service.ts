import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

const credentialsSelect = {
  id: true,
  name: true,
  email: true,
  password: true,
  role: true,
  companyId: true,
} as const;

export type UserCredentials = Prisma.UserGetPayload<{
  select: typeof credentialsSelect;
}>;

@Injectable()
export class UserFindService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<User[]> {
    return this.prisma.user.findMany({ orderBy: { id: 'asc' } });
  }

  async findById(id: number): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (user === null) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findCredentialsByEmail(email: string): Promise<UserCredentials | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: credentialsSelect,
    });
  }

  async assertCompanyExists(companyId: number): Promise<void> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });

    if (company === null) {
      throw new BadRequestException(`Company with id ${companyId} not found`);
    }
  }
}
