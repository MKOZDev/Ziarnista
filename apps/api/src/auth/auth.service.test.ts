import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import * as password from './password';

const credentials = { email: 'jan@example.com', password: 'dlugie-haslo-123' };
const publicUser = {
  id: '019a3b2c-0000-7000-8000-000000000001',
  email: credentials.email,
  name: 'Jan',
  role: 'CUSTOMER' as const,
  createdAt: new Date('2026-10-30T12:00:00Z'),
};

describe('AuthService.verifyCredentials', () => {
  const prismaMock = { user: { findUnique: vi.fn() } };
  const service = new AuthService(prismaMock as unknown as PrismaService);
  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await password.hashPassword(credentials.password);
    await service.onModuleInit();
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    prismaMock.user.findUnique.mockReset();
  });

  it('returns the user without the password hash when the password matches', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ ...publicUser, passwordHash });

    const user = await service.verifyCredentials(credentials);

    expect(user).toEqual(publicUser);
    expect(user).not.toHaveProperty('passwordHash');
  });

  it('returns null for a wrong password', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ ...publicUser, passwordHash });

    await expect(
      service.verifyCredentials({ ...credentials, password: 'zle-haslo-1234' }),
    ).resolves.toBeNull();
  });

  it('still runs a password verification when the email is unknown', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const verify = vi.spyOn(password, 'verifyPassword');

    await expect(service.verifyCredentials(credentials)).resolves.toBeNull();

    // Same argon2 work as for an existing user, against the dummy hash
    expect(verify).toHaveBeenCalledOnce();
    expect(verify.mock.calls[0]?.[0]).toMatch(/^\$argon2id\$/);
  });
});
