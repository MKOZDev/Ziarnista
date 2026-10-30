import type { Request } from 'express';
import type { PublicUser } from './public-user';

/** Request after SessionGuard: `user` is set once the session cookie has been validated. */
export interface AuthenticatedRequest extends Request {
  user?: PublicUser;
}
