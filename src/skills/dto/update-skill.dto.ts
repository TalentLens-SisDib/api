import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateSkillDto {
  @ApiPropertyOptional({
    description: 'New name of the skill',
    minLength: 1,
    maxLength: 100,
    example: 'TypeScript',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'New description of the skill',
    maxLength: 500,
    example: 'Strongly typed JavaScript for large-scale applications',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}