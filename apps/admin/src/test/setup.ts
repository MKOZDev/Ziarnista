import '@testing-library/jest-dom/vitest';
import { clearToasts } from '@ziarnista/ui/toast';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { navigation, useTestSearchParams } from './navigation';
import { server } from './server';

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router,
  usePathname: () => navigation.pathname,
  useSearchParams: useTestSearchParams,
}));

// Node's Request rejects relative URLs, which browsers resolve against the page.
// Fixed here so the production code can keep its plain '/api/v1'.
const NativeRequest = globalThis.Request;
globalThis.Request = class extends NativeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(
      typeof input === 'string' && input.startsWith('/')
        ? new URL(input, window.location.origin).href
        : input,
      init,
    );
  }
};

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});

beforeEach(() => {
  // jsdom has no matchMedia; a light system unless a test says otherwise
  window.matchMedia = () =>
    ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }) as unknown as MediaQueryList;
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  clearToasts();
  navigation.reset();
  window.history.replaceState(null, '', '/');
  localStorage.clear();
  document.documentElement.className = '';
});

afterAll(() => {
  server.close();
});
