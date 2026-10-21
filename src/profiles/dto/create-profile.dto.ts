import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsInstance,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class CreateEducationDto {
  @ApiProperty({ example: 'University of São Paulo', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @Matches(/\S/)
  @MaxLength(200)
  institution!: string;

  @ApiProperty({ example: 'Computer Science', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @Matches(/\S/)
  @MaxLength(200)
  degree!: string;

  @ApiProperty({ example: '2018-02-01', format: 'date-time' })
  @IsDateString({ strict: true })
  startDate!: string;

  @ApiPropertyOptional({ example: '2022-12-15', format: 'date-time', nullable: true })
  @IsOptional()
  @IsDateString({ strict: true })
  endDate?: string | null;
}

export class CreateProfileDto {
  @ApiProperty({
    description: 'Profile name (candidate name)',
    minLength: 1,
    maxLength: 200,
    example: 'John Doe',
  })
  @IsString()
  @MinLength(1)
  @Matches(/\S/)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({
    description: 'Optional description/summary of the candidate',
    maxLength: 2000,
    example: 'Experienced full-stack developer with 10+ years...',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'List of skill names for this profile',
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
    description: 'Education records extracted from the candidate CV',
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
