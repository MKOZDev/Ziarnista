import { beforeEach, describe, expect, it, vi } from 'vitest';
import { THEME_INIT_SCRIPT, THEME_STORAGE_KEY } from './theme-script';
import { createThemeStore } from './theme-store';

type MediaListener = () => void;

/** jsdom has no matchMedia; this one also lets a test flip the system theme. */
function mockSystemTheme(initial: 'light' | 'dark') {
  const media = {
    matches: initial === 'dark',
    listeners: new Set<MediaListener>(),
    addEventListener(_type: 'change', listener: MediaListener) {
      media.listeners.add(listener);
    },
    removeEventListener(_type: 'change', listener: MediaListener) {
      media.listeners.delete(listener);
    },
  };
  window.matchMedia = () => media as unknown as MediaQueryList;
  return {
    set(theme: 'light' | 'dark') {
      media.matches = theme === 'dark';
      media.listeners.forEach((listener) => {
        listener();
      });
    },
  };
}

function runInitScript() {
  // The string is what browsers execute, so that is what gets tested
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  (new Function(THEME_INIT_SCRIPT) as () => void)();
}

function isDark() {
  return document.documentElement.classList.contains('dark');
}

function storageThrows() {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked');
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('THEME_INIT_SCRIPT', () => {
  it('follows the system when nothing is saved', () => {
    mockSystemTheme('dark');
    runInitScript();
    expect(isDark()).toBe(true);
  });

  it('prefers the saved choice over the system', () => {
    mockSystemTheme('dark');
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    runInitScript();
    expect(isDark()).toBe(false);
  });

  it('applies a saved dark theme on a light system', () => {
    mockSystemTheme('light');
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    runInitScript();
    expect(isDark()).toBe(true);
  });

  it('falls back to the system when storage is blocked', () => {
    mockSystemTheme('dark');
    storageThrows();
    expect(runInitScript).not.toThrow();
    expect(isDark()).toBe(true);
  });
});

describe('createThemeStore', () => {
  it('follows a system change while the admin has not chosen', () => {
    const system = mockSystemTheme('light');
    const store = createThemeStore();
    const listener = vi.fn();
    store.subscribe(listener);

    system.set('dark');

    expect(store.getSnapshot()).toBe('dark');
    expect(listener).toHaveBeenCalledOnce();
  });

  it('saves a manual choice and ignores the system from then on', () => {
    const system = mockSystemTheme('light');
    const store = createThemeStore();
    store.subscribe(vi.fn());

    store.toggle();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    system.set('light');
    expect(store.getSnapshot()).toBe('dark');
  });

  it('keeps a manual choice for the visit when storage is blocked', () => {
    const system = mockSystemTheme('light');
    storageThrows();
    const store = createThemeStore();
    store.subscribe(vi.fn());

    store.toggle();
    system.set('light');

    expect(store.getSnapshot()).toBe('dark');
  });

  it('picks up a choice made in another tab', () => {
    mockSystemTheme('light');
    const store = createThemeStore();
    store.subscribe(vi.fn());

    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    window.dispatchEvent(new StorageEvent('storage', { key: THEME_STORAGE_KEY }));

    expect(store.getSnapshot()).toBe('dark');
  });

  it('stops listening after unsubscribe', () => {
    const system = mockSystemTheme('light');
    const store = createThemeStore();
    const unsubscribe = store.subscribe(vi.fn());

    unsubscribe();
    system.set('dark');

    expect(store.getSnapshot()).toBe('light');
  });
});
