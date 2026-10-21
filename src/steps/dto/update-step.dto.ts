import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, MinLength, Min } from 'class-validator';

export class UpdateStepDto {
  @ApiPropertyOptional({
    description: 'Step name',
    minLength: 1,
    maxLength: 200,
    example: 'Technical Interview',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({
    description: 'Step description',
    maxLength: 2000,
    example: 'Technical interview focusing on system design and coding',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Step order in the hiring process',
    minimum: 1,
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;
}