import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSkillDto {
  @ApiProperty({
    description: 'Name of the skill',
    minLength: 1,
    maxLength: 100,
    example: 'TypeScript',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    description: 'Optional description of the skill',
    maxLength: 500,
    example: 'Strongly typed JavaScript for large-scale applications',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}