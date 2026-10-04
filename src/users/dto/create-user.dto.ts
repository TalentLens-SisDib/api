import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '../../generated/prisma/client.js';

export class CreateUserDto {
  @ApiProperty({
    description: 'Unique email address used to sign in',
    format: 'email',
    example: 'ada.admin@talentlens.dev',
    maxLength: 255,
  })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiPropertyOptional({
    description: 'Display name. Defaults to an empty string when omitted',
    maxLength: 255,
    example: 'Ada Admin',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    description:
      'Plain text password. Stored as an argon2id hash and never returned',
    minLength: 8,
    maxLength: 128,
    example: 'supersecret',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiPropertyOptional({
    description: 'Defaults to Recruiter when omitted',
    enum: Role,
    enumName: 'Role',
    example: Role.Recruiter,
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
