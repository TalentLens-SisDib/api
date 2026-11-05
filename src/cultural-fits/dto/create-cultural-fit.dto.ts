import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCulturalFitDto {
  @ApiProperty({
    description: 'Name of the cultural fit',
    minLength: 1,
    maxLength: 100,
    example: 'Trabalho em equipe',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    description: 'Optional description of the cultural fit',
    maxLength: 500,
    example: 'Colabora bem com colegas e compartilha conhecimento',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
