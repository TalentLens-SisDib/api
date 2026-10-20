import { ApiProperty } from '@nestjs/swagger';

export class JobOpeningSkillResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  skillId!: string;

  @ApiProperty({ example: 'TypeScript' })
  skillName!: string;

  @ApiProperty({ example: true })
  isRequired!: boolean;
}