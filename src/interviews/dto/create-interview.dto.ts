import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateInterviewDto {
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
}