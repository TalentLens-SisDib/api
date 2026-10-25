import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class JobOpeningSkillDto {
  @ApiProperty({
    description: 'Skill ID (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  skillId!: string;

  @ApiProperty({
    description: 'Whether this skill is required for the job',
    example: true,
  })
  @IsBoolean()
  isRequired!: boolean;
}

export class JobOpeningCulturalFitDto {
  @ApiProperty({
    description: 'Cultural Fit ID (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  culturalFitId!: string;

  @ApiProperty({
    description: 'Whether this cultural fit is required for the job',
    example: true,
  })
  @IsBoolean()
  isRequired!: boolean;
}

export class CreateJobOpeningDto {
  @ApiProperty({
    description: 'Job opening name',
    minLength: 1,
    maxLength: 200,
    example: 'Senior TypeScript Developer',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    description: 'Job description',
    minLength: 1,
    example: 'We are looking for a Senior TypeScript Developer...',
  })
  @IsString()
  @MinLength(1)
  description!: string;

  @ApiProperty({
    description: 'Expected wage/salary',
    example: 120000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  expectedWage!: number;

  @ApiPropertyOptional({
    description: 'List of required/preferred skills for this job opening',
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

  @ApiPropertyOptional({
    description: 'List of required/preferred cultural fits for this job opening',
    type: [JobOpeningCulturalFitDto],
    example: [
      { culturalFitId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', isRequired: true },
      { culturalFitId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', isRequired: false },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobOpeningCulturalFitDto)
  culturalFits?: JobOpeningCulturalFitDto[];
}
