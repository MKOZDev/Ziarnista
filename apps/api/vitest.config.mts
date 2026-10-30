import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // esbuild (Vitest's default transformer) cannot emit decorator metadata,
  // which NestJS dependency injection relies on, so SWC compiles the tests.
  plugins: [swc.vite()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts'],
          exclude: ['src/**/*.int.test.ts'],
        },
      },
      {
        // Real PostgreSQL (test database, see test/test-database.ts); needs `pnpm db:up`
        extends: true,
        test: {
          name: 'integration',
          include: ['src/**/*.int.test.ts'],
          globalSetup: ['test/global-setup.ts'],
          // Files share one database, so they must not run concurrently
          fileParallelism: false,
        },
      },
    ],
  },
});
