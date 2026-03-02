import { Role } from '../enums/role.enum.js';

export interface JwtPayload {
  userId: string;
  role: Role;
}

export interface AuthenticatedRequest {
  user: JwtPayload;
}
