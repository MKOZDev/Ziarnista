import { SetMetadata } from '@nestjs/common';
import type { Role } from '../../generated/prisma/enums';

export const ROLES_KEY = 'roles';

/** Roles allowed by RolesGuard; the user needs any one of them. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
