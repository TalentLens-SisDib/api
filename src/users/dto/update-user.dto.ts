import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '../../generated/prisma/client.js';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'New unique email address',
    format: 'email',
    example: 'ada.admin@talentlens.dev',
    maxLength: 255,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({
    description: 'New display name',
    maxLength: 255,
    example: 'Ada Admin',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description:
      'New plain text password. Re-hashed with argon2id and never returned',
    minLength: 8,
    maxLength: 128,
    example: 'anothersecret',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password?: string;

  @ApiPropertyOptional({
    description: 'New role',
    enum: Role,
    enumName: 'Role',
    example: Role.Admin,
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
