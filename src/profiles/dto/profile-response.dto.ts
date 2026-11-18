import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EducationResponseDto } from './education-response.dto.js';
import { ProfileInterviewResponseDto } from './profile-interview-response.dto.js';
import { ProfileSkillResponseDto } from './profile-skill-response.dto.js';
import { ProfileApplicationResponseDto } from './profile-application-response.dto.js';
import { ProfileCulturalFitResponseDto } from './profile-cultural-fit-response.dto.js';
import { CompetencyEvidenceResponseDto } from './competency-evidence-response.dto.js';

export class ProfileCreatorResponseDto {
  @ApiProperty({ example: 3 })
  id!: number;

  @ApiProperty({ example: 'Maria Recrutadora' })
  name!: string;
}

export class ProfileResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id!: string;

  @ApiProperty({ example: 'John Doe' })
  name!: string;

  @ApiPropertyOptional({
    example: 'Experienced full-stack developer with 10+ years...',
  })
  description?: string | null;

  @ApiPropertyOptional({ type: [ProfileSkillResponseDto] })
  skills?: ProfileSkillResponseDto[];

  @ApiPropertyOptional({ type: [ProfileCulturalFitResponseDto] })
  culturalFits?: ProfileCulturalFitResponseDto[];

  @ApiPropertyOptional({ type: [EducationResponseDto] })
  educationalBackground?: EducationResponseDto[];

  @ApiPropertyOptional({ type: [ProfileInterviewResponseDto] })
  profileInterviews?: ProfileInterviewResponseDto[];

  @ApiPropertyOptional({ type: [CompetencyEvidenceResponseDto] })
  competencyEvidence?: CompetencyEvidenceResponseDto[];

  @ApiProperty({ type: [ProfileApplicationResponseDto] })
  applications!: ProfileApplicationResponseDto[];

  @ApiPropertyOptional({
    description: 'Warnings that ask recruiters to review AI-extracted data; returned only by CV import',
    type: [String],
  })
  qualityIssues?: string[];

  @ApiProperty({ description: 'Company that owns the candidate record', example: 1 })
  companyId!: number;

  @ApiPropertyOptional({ description: 'Recruiter who registered the candidate', example: 3, nullable: true })
  createdById?: number | null;

  @ApiPropertyOptional({ type: () => ProfileCreatorResponseDto, nullable: true })
  createdBy?: ProfileCreatorResponseDto | null;

  @ApiProperty({ example: '2026-10-04T19:53:33.840Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-10-04T20:02:21.371Z' })
  updatedAt!: Date;
}
