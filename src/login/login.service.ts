import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { verifyPassword } from '../common/password.js';
import { UserFindService } from '../users/services/user-find.service.js';
import { AuthPayload } from './auth-payload.js';
import { LoginDto } from './dto/login.dto.js';
import { LoginResponseDto } from './dto/login-response.dto.js';
import { JWT_TTL_SECONDS } from './jwt.config.js';

@Injectable()
export class LoginService {
  constructor(
    private readonly userFindService: UserFindService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const credentials = await this.userFindService.findCredentialsByEmail(
      dto.email,
    );

    if (
      credentials === null ||
      !(await verifyPassword(credentials.password, dto.password))
    ) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: AuthPayload = {
      sub: credentials.id,
      name: credentials.name,
      email: credentials.email,
      role: credentials.role,
      companyId: credentials.companyId,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: JWT_TTL_SECONDS,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: JWT_TTL_SECONDS,
    };
  }
}
