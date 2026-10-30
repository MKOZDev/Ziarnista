import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'prisma/config';

// Prisma 7 no longer loads .env automatically. The root .env is shared by
// docker-compose and all apps; in production variables come from the environment.
const rootEnvFile = join(__dirname, '../../.env');
if (existsSync(rootEnvFile)) {
  process.loadEnvFile(rootEnvFile);
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // Not validated here: `prisma generate` must work without a database (e.g. in CI)
    url: process.env.DATABASE_URL ?? '',
  },
});
