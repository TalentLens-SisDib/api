import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength, ValidateIf, ValidateNested } from 'class-validator';
import { ApplicationStatus, ClosureReason } from '../../generated/prisma/client.js';

export class CloseJobApplicationDto {
  @ApiProperty({ enum: ClosureReason })
  @IsEnum(ClosureReason)
  reason!: ClosureReason;

  @ApiProperty({ required: false, maxLength: 1000 })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() || undefined : value)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateJobApplicationStatusDto {
  @ApiProperty({ enum: ApplicationStatus })
  @IsEnum(ApplicationStatus)
  status!: ApplicationStatus;

  @ApiProperty({ type: CloseJobApplicationDto, required: false })
  @ValidateIf((dto: UpdateJobApplicationStatusDto) => dto.closure !== undefined)
  @ValidateNested()
  @Type(() => CloseJobApplicationDto)
  closure?: CloseJobApplicationDto;
}
