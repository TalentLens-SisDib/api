import { ApiProperty } from '@nestjs/swagger';

export class ProfileInterviewResponseDto {
  @ApiProperty({
    description: 'Profile interview identifier',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id!: string;

  @ApiProperty({
    description: 'Interview identifier',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  interviewId!: string;

  @ApiProperty({
    description: 'Profile identifier',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  profileId!: string;

  @ApiProperty({
    description: 'Interview transcript',
    example: 'Candidate discussed their experience with React and Node.js...',
  })
  transcript!: string;

  @ApiProperty({
    description: 'Key takeaways from the interview (JSON array of strings)',
    example: '["Strong React skills", "Good system design understanding"]',
  })
  keyTakeaways!: string;

  @ApiProperty({
    description: 'Interview start date',
    example: '2024-01-15T10:30:00.000Z',
  })
  startDate!: Date;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt!: Date;
}