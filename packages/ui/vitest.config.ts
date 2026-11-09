import path from 'node:path';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const configDir = path.join(import.meta.dirname, '.storybook');

// Each theme is a separate project: axe contrast results differ per theme
function storybookProject(theme: 'light' | 'dark') {
  return {
    extends: true as const,
    plugins: [storybookTest({ configDir })],
    define: { 'import.meta.env.VITE_STORYBOOK_THEME': JSON.stringify(theme) },
    test: {
      name: `storybook-${theme}`,
      browser: {
        enabled: true,
        headless: true,
        provider: playwright(),
        instances: [{ browser: 'chromium' as const }],
        screenshotFailures: false,
      },
    },
  };
}

export default defineConfig({
  test: {
    projects: [
      { test: { name: 'unit', include: ['src/**/*.test.ts'], environment: 'node' } },
      storybookProject('light'),
      storybookProject('dark'),
    ],
  },
});
