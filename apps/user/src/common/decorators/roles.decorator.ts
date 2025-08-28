import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../guards/auth.guard';

export type UserRole = 'user' | 'admin' | 'moderator';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
