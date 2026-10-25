import { ApiProperty } from '@nestjs/swagger';

export class JobApplicationResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  profileId!: string;

  @ApiProperty({ example: 'John Doe' })
  profileName!: string;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  jobOpeningId!: string;

  @ApiProperty({ example: '2026-10-04T19:53:33.840Z' })
  appliedAt!: Date;
}
