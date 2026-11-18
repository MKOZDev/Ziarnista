import { DARK_MEDIA_QUERY, THEME_STORAGE_KEY } from './theme-script';

export type Theme = 'light' | 'dark';

function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark';
}

/**
 * The theme lives in the class on <html>, set first by THEME_INIT_SCRIPT; this store keeps it
 * up to date and lets React subscribe. Nothing touches the browser until subscribe or a getter
 * is called, so creating the store during server rendering is safe.
 */
export function createThemeStore() {
  const listeners = new Set<() => void>();
  // Holds the choice for this visit when the browser refuses to store it (private mode, policy)
  let unsavedChoice: Theme | null = null;

  function readChoice(): Theme | null {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      return isTheme(saved) ? saved : unsavedChoice;
    } catch {
      return unsavedChoice;
    }
  }

  function apply(theme: Theme) {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    listeners.forEach((listener) => {
      listener();
    });
  }

  function resolveTheme(): Theme {
    return readChoice() ?? (window.matchMedia(DARK_MEDIA_QUERY).matches ? 'dark' : 'light');
  }

  function getSnapshot(): Theme {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }

  return {
    getSnapshot,

    // Arrow functions: React receives these detached from the store object
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      const media = window.matchMedia(DARK_MEDIA_QUERY);
      // resolveTheme puts a manual choice first, so a system change is ignored after one
      const syncWithSystem = () => {
        apply(resolveTheme());
      };
      const syncWithOtherTab = (event: StorageEvent) => {
        if (event.key === THEME_STORAGE_KEY) {
          apply(resolveTheme());
        }
      };
      media.addEventListener('change', syncWithSystem);
      window.addEventListener('storage', syncWithOtherTab);
      return () => {
        listeners.delete(listener);
        media.removeEventListener('change', syncWithSystem);
        window.removeEventListener('storage', syncWithOtherTab);
      };
    },

    toggle: () => {
      const next: Theme = getSnapshot() === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        unsavedChoice = next;
      }
      apply(next);
    },
  };
}
