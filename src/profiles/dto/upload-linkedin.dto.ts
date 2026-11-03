import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class UploadLinkedinDto {
  @ApiPropertyOptional({ example: 'williamhgates', description: 'Public LinkedIn profile handle; provide this or url' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{1,100}$/)
  username?: string;

  @ApiPropertyOptional({ example: 'https://www.linkedin.com/in/williamhgates/', description: 'Public LinkedIn profile URL; provide this or username' })
  @IsOptional()
  @IsString()
  @Matches(/^https:\/\/(?:[a-z]{2,3}\.)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?(?:\?[^#]*)?$/i)
  url?: string;
}
