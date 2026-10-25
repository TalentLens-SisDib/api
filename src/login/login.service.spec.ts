import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '../generated/prisma/client.js';
import { JWT_REFRESH_TTL_SECONDS } from '../auth/jwt.config.js';
import { hashPassword } from '../common/password.js';
import { UserFindService } from '../users/services/user-find.service.js';
import { LoginService } from './login.service.js';

describe('LoginService token refresh', () => {
  const secret = 'login-service-test-secret';
  const user: User = {
    id: 1,
    email: 'recruiter@example.invalid',
    name: 'Test Recruiter',
    password: 'not-used-by-refresh',
    role: Role.Recruiter,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    companyId: 2,
  };

  let jwtService: JwtService;
  let userFindService: UserFindService & {
    findById: ReturnType<typeof vi.fn>;
    findCredentialsByEmail: ReturnType<typeof vi.fn>;
  };
  let service: LoginService;

  beforeEach(() => {
    jwtService = new JwtService({ secret });
    userFindService = {
      findById: vi.fn().mockResolvedValue(user),
      findCredentialsByEmail: vi.fn(),
    } as unknown as typeof userFindService;
    service = new LoginService(userFindService, jwtService);
  });

  it('issues separate access and refresh token purposes at login', async () => {
    userFindService.findCredentialsByEmail.mockResolvedValue({
      id: user.id,
      name: user.name,
      email: user.email,
      password: await hashPassword('test-password'),
      role: user.role,
      companyId: user.companyId,
    });

    const response = await service.login({
      email: user.email,
      password: 'test-password',
    });

    expect(response.refreshExpiresIn).toBe(JWT_REFRESH_TTL_SECONDS);
    await expect(
      jwtService.verifyAsync(response.accessToken),
    ).resolves.toMatchObject({
      sub: user.id,
      tokenUse: 'access',
    });
    await expect(
      jwtService.verifyAsync(response.refreshToken),
    ).resolves.toEqual(
      expect.objectContaining({ sub: user.id, tokenUse: 'refresh' }),
    );
  });

  it('exchanges a valid refresh token for an access token using current user data', async () => {
    const token = await jwtService.signAsync(
      { sub: user.id, tokenUse: 'refresh' },
      { expiresIn: 60 },
    );

    const response = await service.refresh(token);

    await expect(
      jwtService.verifyAsync(response.accessToken),
    ).resolves.toMatchObject({
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      tokenUse: 'access',
    });
    expect(userFindService.findById).toHaveBeenCalledWith(user.id);
  });

  it('rejects an invalid token', async () => {
    await expect(service.refresh('not-a-jwt')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects an expired refresh token', async () => {
    const token = await jwtService.signAsync(
      {
        sub: user.id,
        tokenUse: 'refresh',
        iat: Math.floor(Date.now() / 1000) - 60,
      },
      { expiresIn: 30 },
    );

    await expect(service.refresh(token)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects an access token used as a refresh token', async () => {
    const token = await jwtService.signAsync(
      { sub: user.id, tokenUse: 'access' },
      { expiresIn: 60 },
    );

    await expect(service.refresh(token)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects refresh tokens for users that no longer exist', async () => {
    userFindService.findById.mockRejectedValue(new NotFoundException());
    const token = await jwtService.signAsync(
      { sub: user.id, tokenUse: 'refresh' },
      { expiresIn: 60 },
    );

    await expect(service.refresh(token)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
