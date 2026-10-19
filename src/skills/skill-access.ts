import { AuthPayload } from '../auth/auth-payload.js';
import { ForbiddenException } from '@nestjs/common';

export function assertCanManageSkill(requester: AuthPayload): void {
  if (requester.role !== 'Admin') {
    throw new ForbiddenException('Only administrators can manage skills');
  }
}