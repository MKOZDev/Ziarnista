import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('password hashing', () => {
  it('produces an argon2id hash with the configured parameters', async () => {
    const passwordHash = await hashPassword('correct horse battery');
    expect(passwordHash).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
  });

  it('verifies the correct password and rejects a wrong one', async () => {
    const passwordHash = await hashPassword('correct horse battery');
    await expect(verifyPassword(passwordHash, 'correct horse battery')).resolves.toBe(true);
    await expect(verifyPassword(passwordHash, 'correct horse batterY')).resolves.toBe(false);
  });

  it('salts every hash', async () => {
    const [first, second] = await Promise.all([hashPassword('same'), hashPassword('same')]);
    expect(first).not.toBe(second);
  });
});
