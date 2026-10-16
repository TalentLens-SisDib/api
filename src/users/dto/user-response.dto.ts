import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../generated/prisma/client.js';

export class UserResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'ada.admin@talentlens.dev' })
  email!: string;

  @ApiProperty({ example: 'Ada Admin' })
  name!: string;

  @ApiProperty({ enum: Role, enumName: 'Role', example: Role.Recruiter })
  role!: Role;

  @ApiProperty({ example: 1 })
  companyId!: number;

  @ApiProperty({ example: '2026-10-04T19:53:33.840Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-10-04T20:02:21.371Z' })
  updatedAt!: Date;
}
