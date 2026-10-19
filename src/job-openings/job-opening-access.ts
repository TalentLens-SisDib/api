import { AuthPayload } from '../auth/auth-payload.js';
import { ForbiddenException } from '@nestjs/common';
import { JobOpening } from '../generated/prisma/client.js';

export function assertCanManageJobOpening(requester: AuthPayload, jobOpening: JobOpening): void {
  const isOwner = jobOpening.userId === requester.sub;
  const isAdmin = requester.role === 'Admin';

  if (!isOwner && !isAdmin) {
    throw new ForbiddenException('You can only manage your own job openings');
  }
}