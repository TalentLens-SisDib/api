import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class AddProfileInterviewDto {
  @ApiProperty({
    description: 'Interview ID to associate with the profile. The profile must have applied to the job opening of the interview step.',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  interviewId!: string;

  @ApiProperty({
    description: 'Interview transcript',
    example: 'Candidate discussed their experience with React and Node.js...',
  })
  @IsString()
  @MinLength(1)
  transcript!: string;

  @ApiPropertyOptional({
    description: 'Key takeaways from the interview (array of strings, max 255 chars each)',
    type: [String],
    example: ['Strong React skills', 'Good system design understanding', 'Needs improvement in testing'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(255, { each: true })
  keyTakeaways?: string[];

  @ApiPropertyOptional({
    description: 'Interview start date in ISO 8601 (defaults to current date/time)',
    example: '2024-01-15T10:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;
}
