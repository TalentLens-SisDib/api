import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prisma } from '../../generated/prisma/client.js';
import { JobOpeningSkillResponseDto } from './job-opening-skill-response.dto.js';

export class JobOpeningResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id!: string;

  @ApiProperty({ example: 'Senior TypeScript Developer' })
  name!: string;

  @ApiProperty({ example: 'We are looking for a Senior TypeScript Developer...' })
  description!: string;

  @ApiProperty({ example: 120000 })
  expectedWage!: Prisma.Decimal;

  @ApiProperty({ example: 1 })
  companyId!: number;

  @ApiProperty({ example: 1 })
  userId!: number;

  @ApiPropertyOptional({ type: [JobOpeningSkillResponseDto] })
  skills?: JobOpeningSkillResponseDto[];

  @ApiProperty({ example: '2026-10-04T19:53:33.840Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-10-04T20:02:21.371Z' })
  updatedAt!: Date;
}