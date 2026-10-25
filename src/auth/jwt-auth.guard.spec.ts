import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard.js';

describe('JwtAuthGuard token purpose', () => {
  const jwtService = new JwtService({ secret: 'jwt-auth-guard-test-secret' });
  const guard = new JwtAuthGuard(jwtService);

  function contextFor(token: string): ExecutionContext {
    const request = { headers: { authorization: `Bearer ${token}` } };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }

  it('rejects a refresh token on protected access-token routes', async () => {
    const token = await jwtService.signAsync(
      {
        sub: 1,
        name: 'Test Recruiter',
        email: 'recruiter@example.invalid',
        role: 'Recruiter',
        companyId: 1,
        tokenUse: 'refresh',
      },
      { expiresIn: 60 },
    );

    await expect(guard.canActivate(contextFor(token))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('keeps accepting existing access tokens without a token purpose claim', async () => {
    const token = await jwtService.signAsync(
      {
        sub: 1,
        name: 'Test Recruiter',
        email: 'recruiter@example.invalid',
        role: 'Recruiter',
        companyId: 1,
      },
      { expiresIn: 60 },
    );

    await expect(guard.canActivate(contextFor(token))).resolves.toBe(true);
  });
});
