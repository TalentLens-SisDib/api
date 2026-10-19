import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { JobOpeningSkillDto } from './create-job-opening.dto.js';

export class UpdateJobOpeningDto {
  @ApiPropertyOptional({
    description: 'New job opening name',
    minLength: 1,
    maxLength: 200,
    example: 'Senior TypeScript Developer',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({
    description: 'New job description',
    minLength: 1,
    example: 'We are looking for a Senior TypeScript Developer...',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string;

  @ApiPropertyOptional({
    description: 'New expected wage/salary',
    example: 130000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  expectedWage?: number;

  @ApiPropertyOptional({
    description: 'New list of required/preferred skills for this job opening (replaces existing)',
    type: [JobOpeningSkillDto],
    example: [
      { skillId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', isRequired: true },
      { skillId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', isRequired: false },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobOpeningSkillDto)
  skills?: JobOpeningSkillDto[];
}