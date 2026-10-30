import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // esbuild (Vitest's default transformer) cannot emit decorator metadata,
  // which NestJS dependency injection relies on, so SWC compiles the tests.
  plugins: [swc.vite()],
  test: {
    include: ['src/**/*.test.ts'],
  },
});
