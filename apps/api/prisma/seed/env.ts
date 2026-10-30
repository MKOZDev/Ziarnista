import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';

const rootEnvFile = join(__dirname, '../../../../.env');

const email = z.email().transform((value) => value.toLowerCase());
const password = z.string().min(12, 'must be at least 12 characters');

const seedEnvSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  SEED_ADMIN_EMAIL: email,
  SEED_ADMIN_PASSWORD: password,
  SEED_CUSTOMER_EMAIL: email,
  SEED_CUSTOMER_PASSWORD: password,
});

export type SeedEnv = z.infer<typeof seedEnvSchema>;

/** Loads the root .env (if present; the environment wins) and validates the seed variables. */
export function loadSeedEnv(): SeedEnv {
  if (existsSync(rootEnvFile)) {
    process.loadEnvFile(rootEnvFile);
  }

  const result = seedEnvSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
