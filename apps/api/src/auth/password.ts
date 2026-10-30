import { hash, verify } from '@node-rs/argon2';

// OWASP minimum for argon2id: m=19 MiB, t=2, p=1. The algorithm defaults to argon2id
// (the library's Algorithm is a const enum, unusable with isolatedModules).
const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

/** Returns a PHC string ($argon2id$v=19$m=...), which embeds the salt and parameters. */
export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

/** Parameters are read from the hash itself, so old hashes keep working if the options change. */
export function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  return verify(passwordHash, password);
}
