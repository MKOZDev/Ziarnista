import { describe, expect, it } from 'vitest';
import { SESSION_POLICIES } from './session-policy';
import { generateSessionToken, hashSessionToken, shouldRenewSession } from './session-token';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('generateSessionToken', () => {
  it('encodes 32 random bytes as base64url', () => {
    const token = generateSessionToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(Buffer.from(token, 'base64url')).toHaveLength(32);
  });

  it('returns a different token every time', () => {
    const tokens = new Set(Array.from({ length: 100 }, generateSessionToken));
    expect(tokens.size).toBe(100);
  });
});

describe('hashSessionToken', () => {
  it('is a deterministic SHA-256 hex digest that differs from the token', () => {
    const token = generateSessionToken();
    expect(hashSessionToken(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
    expect(hashSessionToken(token)).not.toBe(hashSessionToken(generateSessionToken()));
  });
});

describe('shouldRenewSession', () => {
  const now = new Date('2026-10-30T12:00:00Z');
  const inDays = (days: number) => new Date(now.getTime() + days * DAY_MS);

  it('renews a storefront session once less than half of its 30 days remain', () => {
    expect(shouldRenewSession(inDays(16), now, SESSION_POLICIES.STOREFRONT)).toBe(false);
    expect(shouldRenewSession(inDays(14), now, SESSION_POLICIES.STOREFRONT)).toBe(true);
  });

  it('never renews an admin session', () => {
    expect(shouldRenewSession(new Date(now.getTime() + 1000), now, SESSION_POLICIES.ADMIN)).toBe(
      false,
    );
  });
});
