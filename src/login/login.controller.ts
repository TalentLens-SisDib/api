import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto.js';
import { LoginResponseDto } from './dto/login-response.dto.js';
import { RefreshResponseDto } from './dto/refresh-response.dto.js';
import { LoginService } from './login.service.js';

@ApiTags('login')
@Controller('login')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exchange email and password for a Bearer token',
  })
  @ApiOkResponse({
    description: 'The signed access token and its metadata',
    type: LoginResponseDto,
  })
  @ApiBadRequestResponse({ description: 'The payload failed validation' })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.loginService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Exchange a refresh token for a new access token',
    description:
      'Send the refresh token in the Authorization header. This endpoint has no request body.',
  })
  @ApiOkResponse({
    description: 'A new signed access token and its metadata',
    type: RefreshResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid or expired refresh token',
  })
  refresh(
    @Headers('authorization') authorization: string | undefined,
  ): Promise<RefreshResponseDto> {
    const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
    if (!token) {
      throw new UnauthorizedException('Missing bearer refresh token');
    }

    return this.loginService.refresh(token);
  }
}
