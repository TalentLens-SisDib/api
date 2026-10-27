import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileInterviewDto {
  @ApiPropertyOptional({
    description: 'Interview transcript',
    example: 'Candidate discussed their experience with React and Node.js...',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  transcript?: string;

  @ApiPropertyOptional({
    description: 'Key takeaways from the interview (array of strings, max 255 chars each). Replaces the current list.',
    type: [String],
    example: ['Strong React skills', 'Good system design understanding'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(255, { each: true })
  keyTakeaways?: string[];

  @ApiPropertyOptional({
    description: 'Interview start date in ISO 8601',
    example: '2024-01-15T10:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;
}
