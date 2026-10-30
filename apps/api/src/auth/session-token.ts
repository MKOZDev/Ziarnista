import { createHash, randomBytes } from 'node:crypto';
import type { SessionPolicy } from './session-policy';

const TOKEN_BYTES = 32;

/** Random token sent to the browser in the session cookie; never stored in the database. */
export function generateSessionToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

/**
 * Session id stored in the database. SHA-256 rather than a slow password hash: the token
 * has 256 bits of entropy, so brute force is hopeless anyway, and a fast deterministic hash
 * allows a primary-key lookup. A leaked sessions table yields no usable cookies.
 */
export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Sliding sessions are renewed only once half of their lifetime has passed, so an active
 * user causes at most one write per half-TTL instead of one on every request.
 */
export function shouldRenewSession(expiresAt: Date, now: Date, policy: SessionPolicy): boolean {
  return policy.sliding && expiresAt.getTime() - now.getTime() < policy.ttlMs / 2;
}
