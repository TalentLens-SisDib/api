import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ProfileSkillDto {
  @ApiProperty({
    description: 'Skill ID (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  skillId!: string;
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
    description: 'List of skill IDs for this profile',
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