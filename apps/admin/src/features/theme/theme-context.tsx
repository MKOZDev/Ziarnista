'use client';

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { createThemeStore, type Theme } from './theme-store';

type ThemeContextValue = { theme: Theme; toggleTheme: () => void };

const ThemeContext = createContext<ThemeContextValue | null>(null);

// The server cannot know the theme. React renders this value first, so hydration matches,
// then switches to the real one; only the toggle's icon depends on it, the colors come from CSS.
function getServerTheme(): Theme {
  return 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createThemeStore);
  const theme = useSyncExternalStore(store.subscribe, store.getSnapshot, getServerTheme);
  const value = useMemo(() => ({ theme, toggleTheme: store.toggle }), [theme, store]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return value;
}
