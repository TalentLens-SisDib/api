import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthenticatedRequest, AuthPayload } from './auth-payload.js';

const BEARER_PREFIX = 'bearer ';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request.headers.authorization);

    if (token === undefined) {
      throw new UnauthorizedException('Missing bearer token');
    }

    let payload: AuthPayload & { tokenUse?: string };
    try {
      payload = await this.jwtService.verifyAsync<
        AuthPayload & { tokenUse?: string }
      >(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Tokens issued before token purposes were added remain valid access tokens.
    if (payload.tokenUse !== undefined && payload.tokenUse !== 'access') {
      throw new UnauthorizedException('Invalid or expired token');
    }

    request.user = payload;
    return true;
  }
}

function extractBearerToken(header: string | undefined): string | undefined {
  if (header === undefined || !header.toLowerCase().startsWith(BEARER_PREFIX)) {
    return undefined;
  }

  const token = header.slice(BEARER_PREFIX.length).trim();

  return token.length > 0 ? token : undefined;
}
