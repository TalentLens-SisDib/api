import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ProfileSkillDto } from './create-profile.dto.js';

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
    description: 'New list of skill IDs for this profile (replaces existing)',
    type: [ProfileSkillDto],
    example: [
      { skillId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
      { skillId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProfileSkillDto)
  skills?: ProfileSkillDto[];
}