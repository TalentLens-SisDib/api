import { Request } from 'express';
import { Role } from '../generated/prisma/client.js';

export interface AuthPayload {
  sub: number;
  name: string;
  email: string;
  role: Role;
  companyId: number;
}

export interface AuthenticatedRequest extends Request {
  user: AuthPayload;
}
