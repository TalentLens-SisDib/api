import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { User } from '../generated/prisma/client.js';
import { AuthPayload } from '../auth/auth-payload.js';
import {
  JWT_REFRESH_TTL_SECONDS,
  JWT_TTL_SECONDS,
} from '../auth/jwt.config.js';
import { verifyPassword } from '../common/password.js';
import { UserFindService } from '../users/services/user-find.service.js';
import { LoginDto } from './dto/login.dto.js';
import { LoginResponseDto } from './dto/login-response.dto.js';
import { RefreshResponseDto } from './dto/refresh-response.dto.js';

const INVALID_REFRESH_TOKEN = 'Invalid or expired refresh token';

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

    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(payload),
      this.jwtService.signAsync(
        { sub: credentials.id, tokenUse: 'refresh' },
        { expiresIn: JWT_REFRESH_TTL_SECONDS },
      ),
    ]);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: JWT_TTL_SECONDS,
      refreshToken,
      refreshExpiresIn: JWT_REFRESH_TTL_SECONDS,
    };
  }

  async refresh(token: string): Promise<RefreshResponseDto> {
    let payload: Record<string, unknown>;
    try {
      payload =
        await this.jwtService.verifyAsync<Record<string, unknown>>(token);
    } catch {
      throw new UnauthorizedException(INVALID_REFRESH_TOKEN);
    }

    if (
      payload === null ||
      typeof payload !== 'object' ||
      payload['tokenUse'] !== 'refresh' ||
      !Number.isSafeInteger(payload['sub']) ||
      (payload['sub'] as number) < 1
    ) {
      throw new UnauthorizedException(INVALID_REFRESH_TOKEN);
    }

    let user: User;
    try {
      user = await this.userFindService.findById(payload['sub'] as number);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new UnauthorizedException(INVALID_REFRESH_TOKEN);
      }
      throw error;
    }

    const accessToken = await this.signAccessToken({
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    });

    return { accessToken, tokenType: 'Bearer', expiresIn: JWT_TTL_SECONDS };
  }

  private signAccessToken(payload: AuthPayload): Promise<string> {
    return this.jwtService.signAsync(
      { ...payload, tokenUse: 'access' },
      { expiresIn: JWT_TTL_SECONDS },
    );
  }
}
