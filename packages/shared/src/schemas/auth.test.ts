import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema } from './auth';

const valid = { email: 'jan@example.com', password: 'dlugie-haslo-123', name: 'Jan' };

describe('registerSchema', () => {
  it('trims and lowercases the email', () => {
    expect(registerSchema.parse({ ...valid, email: '  Jan@Example.COM ' }).email).toBe(
      'jan@example.com',
    );
  });

  it('rejects an invalid email', () => {
    expect(registerSchema.safeParse({ ...valid, email: 'jan@' }).success).toBe(false);
  });

  it('requires a password of at least 12 characters', () => {
    expect(registerSchema.safeParse({ ...valid, password: 'a'.repeat(11) }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, password: 'a'.repeat(12) }).success).toBe(true);
  });

  it('rejects a password longer than 128 characters', () => {
    expect(registerSchema.safeParse({ ...valid, password: 'a'.repeat(129) }).success).toBe(false);
  });

  it('rejects a blank name', () => {
    expect(registerSchema.safeParse({ ...valid, name: '   ' }).success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('accepts a short password (the length policy applies only to new passwords)', () => {
    expect(loginSchema.safeParse({ email: 'jan@example.com', password: 'krotkie' }).success).toBe(
      true,
    );
  });

  it('rejects an empty password', () => {
    expect(loginSchema.safeParse({ email: 'jan@example.com', password: '' }).success).toBe(false);
  });
});
