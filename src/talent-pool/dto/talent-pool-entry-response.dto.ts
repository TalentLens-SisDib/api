import { ApiProperty } from '@nestjs/swagger';
import { ProfileCulturalFitResponseDto } from '../../profiles/dto/profile-cultural-fit-response.dto.js';
import { ProfileSkillResponseDto } from '../../profiles/dto/profile-skill-response.dto.js';

class TalentPoolAuthorDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  name!: string;
}

class TalentPoolProfileDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: String, nullable: true })
  description!: string | null;

  @ApiProperty({ type: [ProfileSkillResponseDto] })
  skills!: ProfileSkillResponseDto[];

  @ApiProperty({ type: [ProfileCulturalFitResponseDto] })
  culturalFits!: ProfileCulturalFitResponseDto[];
}

export class TalentPoolEntryResponseDto {
  @ApiProperty({ format: 'uuid' })
  profileId!: string;

  @ApiProperty({ type: String, nullable: true, maxLength: 1000 })
  note!: string | null;

  @ApiProperty()
  addedAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ type: TalentPoolAuthorDto, nullable: true })
  addedBy!: TalentPoolAuthorDto | null;

  @ApiProperty({ type: TalentPoolProfileDto })
  profile!: TalentPoolProfileDto;
}
