import { ApiProperty, OmitType } from '@nestjs/swagger';
import { JobOpeningResponseDto } from '../../job-openings/dto/job-opening-response.dto.js';
import type { Prisma } from '../../generated/prisma/client.js';

export class ProfileJobOpeningResponseDto extends OmitType(
  JobOpeningResponseDto,
  ['skills', 'expectedWage'] as const,
) {
  @ApiProperty({ type: String, example: '120000' })
  expectedWage!: Prisma.Decimal;
}
