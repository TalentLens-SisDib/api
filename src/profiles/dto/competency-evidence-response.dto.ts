import { ApiProperty } from '@nestjs/swagger';
import { CompetencyEvidenceSource } from '../../generated/prisma/client.js';

export class CompetencyEvidenceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  competencyId!: string;

  @ApiProperty()
  competencyName!: string;

  @ApiProperty({ enum: CompetencyEvidenceSource })
  sourceType!: CompetencyEvidenceSource;

  @ApiProperty()
  sourceLabel!: string;

  @ApiProperty({ maxLength: 500 })
  excerpt!: string;

  @ApiProperty()
  createdAt!: Date;
}
