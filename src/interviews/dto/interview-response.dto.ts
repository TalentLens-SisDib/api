import { ApiProperty } from '@nestjs/swagger';

export class InterviewResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id!: string;

  @ApiProperty({ example: 'Candidate discussed their experience with React and Node.js...' })
  transcript!: string;

  @ApiProperty({ type: [String], example: ['Strong React skills', 'Good system design understanding'] })
  keyTakeaways!: string[];

  @ApiProperty({ example: 1 })
  userId!: number;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  stepId!: string;

  @ApiProperty({ example: '2026-10-04T19:53:33.840Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-10-04T20:02:21.371Z' })
  updatedAt!: Date;
}