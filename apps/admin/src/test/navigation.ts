import { vi } from 'vitest';

/** Stands in for next/navigation; setup.ts wires it in and resets it after each test. */
export const navigation = {
  pathname: '/',
  router: { replace: vi.fn<(href: string) => void>(), prefetch: vi.fn() },
};
