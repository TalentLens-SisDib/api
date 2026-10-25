import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    description: 'Signed JWT to send as `Authorization: Bearer <token>`',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken!: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType!: 'Bearer';

  @ApiProperty({ description: 'Token lifetime in seconds', example: 3600 })
  expiresIn!: number;

  @ApiProperty({
    description:
      'Signed refresh JWT to send as `Authorization: Bearer <token>` to POST /login/refresh',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...refresh',
  })
  refreshToken!: string;

  @ApiProperty({
    description: 'Refresh token lifetime in seconds',
    example: 604800,
  })
  refreshExpiresIn!: number;
}
