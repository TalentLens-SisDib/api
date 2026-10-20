import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SkillResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id!: string;

  @ApiProperty({ example: 'TypeScript' })
  name!: string;

  @ApiPropertyOptional({ example: 'Strongly typed JavaScript for large-scale applications' })
  description?: string | null;

  @ApiProperty({ example: '2026-10-04T19:53:33.840Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-10-04T20:02:21.371Z' })
  updatedAt!: Date;
}