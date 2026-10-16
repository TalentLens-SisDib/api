import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest, AuthPayload } from './auth-payload.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthPayload => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    return request.user;
  },
);
