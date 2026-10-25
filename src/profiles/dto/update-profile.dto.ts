import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsInstance,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { CreateEducationDto } from './create-profile.dto.js';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'New profile name (candidate name)',
    minLength: 1,
    maxLength: 200,
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({
    description: 'New description/summary of the candidate',
    maxLength: 2000,
    example: 'Experienced full-stack developer with 10+ years...',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'New list of skill names for this profile (replaces existing)',
    type: [String],
    example: ['TypeScript', 'React', 'Node.js'],
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  @ArrayMaxSize(100)
  skills?: string[];

  @ApiPropertyOptional({
    description: 'New list of cultural fit names for this profile (replaces existing)',
    type: [String],
    example: ['Collaborative', 'Innovative', 'Growth mindset'],
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  @ArrayMaxSize(50)
  culturalFits?: string[];

  @ApiPropertyOptional({
    description: 'Replacement education records for this profile',
    type: [CreateEducationDto],
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsArray()
  @ArrayMaxSize(25)
  @IsInstance(CreateEducationDto, { each: true })
  @ValidateNested({ each: true })
  @Type(() => CreateEducationDto)
  educationalBackground?: CreateEducationDto[];
}
