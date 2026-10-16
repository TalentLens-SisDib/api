import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email address registered for the account',
    format: 'email',
    example: 'recruiter@talentlens.dev',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Plain text password, compared against the stored hash',
    example: 'recruiter123',
  })
  @IsString()
  @MaxLength(128)
  password!: string;
}
