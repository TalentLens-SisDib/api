import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ApplicationStatus } from '../../generated/prisma/client.js';

export class UpdateJobApplicationStatusDto {
  @ApiProperty({ enum: ApplicationStatus })
  @IsEnum(ApplicationStatus)
  status!: ApplicationStatus;
}
