import { describe, expect, it } from 'vitest';
import { healthResponseSchema } from './health';

const validResponse = {
  status: 'ok',
  database: 'up',
  uptime: 42.1,
  timestamp: '2026-10-30T12:00:00.000Z',
};

describe('healthResponseSchema', () => {
  it('accepts a healthy response', () => {
    expect(healthResponseSchema.parse(validResponse)).toEqual(validResponse);
  });

  it('accepts a response with the database down', () => {
    const response = { ...validResponse, status: 'error', database: 'down' };
    expect(healthResponseSchema.safeParse(response).success).toBe(true);
  });

  it.each([
    { status: 'degraded' },
    { database: 'unknown' },
    { uptime: -1 },
    { uptime: '42' },
    { timestamp: 'yesterday' },
  ])('rejects invalid field %o', (override) => {
    expect(healthResponseSchema.safeParse({ ...validResponse, ...override }).success).toBe(false);
  });

  it('rejects a non-health body, e.g. an HTML error page', () => {
    expect(healthResponseSchema.safeParse('<html>Bad Gateway</html>').success).toBe(false);
  });
});
