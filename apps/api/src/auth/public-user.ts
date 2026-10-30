import type { AuthUser } from '@ziarnista/shared';
import type { Prisma } from '../generated/prisma/client';

/** The only user columns that may leave the API. passwordHash is never even read. */
export const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{ select: typeof publicUserSelect }>;

export function toAuthUser(user: PublicUser): AuthUser {
  return { ...user, createdAt: user.createdAt.toISOString() };
}
