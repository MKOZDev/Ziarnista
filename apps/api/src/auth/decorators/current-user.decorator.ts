import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from '../authenticated-request';
import type { PublicUser } from '../public-user';

/** The logged-in user set by SessionGuard. */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const user = ctx.switchToHttp().getRequest<AuthenticatedRequest>().user;
  if (!user) {
    // A programming error (missing @Auth()/@AdminAuth()), not a client one
    throw new Error('@CurrentUser() used on a route without SessionGuard');
  }
  return user satisfies PublicUser;
});
