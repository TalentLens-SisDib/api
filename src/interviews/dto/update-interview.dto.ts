import { ApiProperty } from '@nestjs/swagger';

export class UpdateInterviewDto {
  @ApiProperty({
    description: 'Step ID to move the interview to',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  stepId?: string;
}