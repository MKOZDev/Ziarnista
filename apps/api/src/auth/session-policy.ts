import type { SessionScope } from '../generated/prisma/enums';

export interface SessionPolicy {
  cookieName: string;
  ttlMs: number;
  /** Sliding sessions are extended while in use; fixed ones expire ttlMs after login. */
  sliding: boolean;
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// Separate cookie names: browsers do not isolate cookies by port, so on localhost
// the storefront (:3000) and the admin panel (:3001) would otherwise overwrite each other.
export const SESSION_POLICIES: Record<SessionScope, SessionPolicy> = {
  STOREFRONT: { cookieName: 'zia_session', ttlMs: 30 * DAY_MS, sliding: true },
  ADMIN: { cookieName: 'zia_admin_session', ttlMs: 8 * HOUR_MS, sliding: false },
};
