import { useSyncExternalStore } from 'react';
import { vi } from 'vitest';

type NavigateOptions = { scroll?: boolean };

const listeners = new Set<() => void>();
let searchParams = new URLSearchParams();

/** Like a real navigation: the new query string re-renders components using useSearchParams. */
function navigate(href: string) {
  searchParams = new URLSearchParams(new URL(href, 'http://localhost:3000').search);
  for (const listener of listeners) listener();
}

/** Stands in for next/navigation; setup.ts wires it in and resets it after each test. */
export const navigation = {
  pathname: '/',
  router: {
    push: vi.fn<(href: string, options?: NavigateOptions) => void>(navigate),
    replace: vi.fn<(href: string, options?: NavigateOptions) => void>(navigate),
    prefetch: vi.fn(),
  },
  /** The page a test starts on, e.g. setUrl('/products?status=DRAFT') */
  setUrl(href: string) {
    const url = new URL(href, 'http://localhost:3000');
    navigation.pathname = url.pathname;
    navigate(href);
  },
  /** The current query string, for assertions */
  get search(): string {
    return searchParams.toString();
  },
  reset() {
    navigation.pathname = '/';
    searchParams = new URLSearchParams();
    navigation.router.push.mockClear();
    navigation.router.replace.mockClear();
  },
};

export function useTestSearchParams(): URLSearchParams {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => searchParams,
  );
}
