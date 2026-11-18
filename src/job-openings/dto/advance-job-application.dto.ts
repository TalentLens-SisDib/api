import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, ValidateIf } from 'class-validator';

export class AdvanceJobApplicationDto {
  @ApiProperty({
    description: 'Etapa exibida antes da mudança; null indica que ainda não iniciou',
    format: 'uuid',
    nullable: true,
  })
  @ValidateIf((_object, value) => value !== null)
  @IsUUID()
  fromStepId!: string | null;
}
