import { ApiProperty } from '@nestjs/swagger';

export class JobOpeningCulturalFitResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  culturalFitId!: string;

  @ApiProperty({ example: 'Collaborative' })
  culturalFitName!: string;

  @ApiProperty({ example: true })
  isRequired!: boolean;
}