import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ApplicationStatus } from '../../generated/prisma/client.js';

class JobApplicationStepResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  order!: number;
}

class CandidatePriorityScoreDto {
  @ApiProperty()
  requiredSkills!: number;

  @ApiProperty()
  requiredBehavioral!: number;

  @ApiProperty()
  desiredSkills!: number;

  @ApiProperty()
  desiredBehavioral!: number;
}

export class JobApplicationResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  profileId!: string;

  @ApiProperty({ example: 'John Doe' })
  profileName!: string;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  jobOpeningId!: string;

  @ApiProperty({ example: '2026-10-04T19:53:33.840Z' })
  appliedAt!: Date;

  @ApiProperty({ type: JobApplicationStepResponseDto, nullable: true })
  currentStep!: JobApplicationStepResponseDto | null;

  @ApiProperty({ enum: ApplicationStatus })
  status!: ApplicationStatus;

  @ApiProperty({ example: '2026-11-08T14:49:15.018Z' })
  stageUpdatedAt!: Date;

  @ApiPropertyOptional({ nullable: true, description: 'Candidate rank; null when the job has no criteria' })
  priority?: number | null;

  @ApiPropertyOptional({ type: CandidatePriorityScoreDto })
  priorityScore?: CandidatePriorityScoreDto;
}
