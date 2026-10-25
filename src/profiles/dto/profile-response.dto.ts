import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EducationResponseDto } from './education-response.dto.js';
import { ProfileInterviewResponseDto } from './profile-interview-response.dto.js';
import { ProfileSkillResponseDto } from './profile-skill-response.dto.js';
import { ProfileApplicationResponseDto } from './profile-application-response.dto.js';

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

  @ApiPropertyOptional({ type: [EducationResponseDto] })
  educationalBackground?: EducationResponseDto[];

  @ApiPropertyOptional({ type: [ProfileInterviewResponseDto] })
  profileInterviews?: ProfileInterviewResponseDto[];

  @ApiProperty({ type: [ProfileApplicationResponseDto] })
  applications!: ProfileApplicationResponseDto[];

  @ApiProperty({ example: '2026-10-04T19:53:33.840Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-10-04T20:02:21.371Z' })
  updatedAt!: Date;
}
