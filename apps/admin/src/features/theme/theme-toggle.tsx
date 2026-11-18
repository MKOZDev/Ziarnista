'use client';

import { IconButton } from '@ziarnista/ui/icon-button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from './theme-context';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <IconButton
      aria-label={isDark ? 'Włącz jasny motyw' : 'Włącz ciemny motyw'}
      onClick={toggleTheme}
    >
      {isDark ? <Sun aria-hidden /> : <Moon aria-hidden />}
    </IconButton>
  );
}
