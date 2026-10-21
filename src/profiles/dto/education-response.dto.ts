import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EducationResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id!: string;

  @ApiProperty({ example: 'University of São Paulo' })
  institution!: string;

  @ApiProperty({ example: 'Computer Science' })
  degree!: string;

  @ApiProperty({ example: '2018-02-01T00:00:00.000Z' })
  startDate!: Date;

  @ApiPropertyOptional({ example: '2022-12-15T00:00:00.000Z', nullable: true })
  endDate!: Date | null;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  profileId!: string;
}
