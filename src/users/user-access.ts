import { ForbiddenException } from '@nestjs/common';
import { AuthPayload } from '../auth/auth-payload.js';
import { Role } from '../generated/prisma/client.js';

export interface ManagedUser {
  id: number;
  companyId: number;
}

export function canManageUser(
  requester: AuthPayload,
  target: ManagedUser,
): boolean {
  if (requester.sub === target.id) {
    return true;
  }

  return (
    requester.role === Role.Admin && requester.companyId === target.companyId
  );
}

export function assertCanManageUser(
  requester: AuthPayload,
  target: ManagedUser,
): void {
  if (!canManageUser(requester, target)) {
    throw new ForbiddenException(
      'You can only manage your own account or users of your own company as an admin',
    );
  }
}
