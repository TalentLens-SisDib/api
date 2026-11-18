import { Request } from 'express';
import { Role } from '../generated/prisma/client.js';

export interface AuthPayload {
  sub: number;
  name: string;
  email: string;
  role: Role;
  companyId: number;
  /** Nome da empresa, para exibição no app. Ausente em tokens emitidos antes deste campo. */
  companyName?: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthPayload;
}
