import type { Decorator, Preview } from '@storybook/react-vite';
import './storybook.css';

// Set during render, before axe runs, so the checks always see the requested theme
const withTheme: Decorator = (Story, { globals }) => {
  document.documentElement.classList.toggle('dark', globals.theme === 'dark');
  return Story();
};

const preview: Preview = {
  decorators: [withTheme],
  initialGlobals: {
    theme: (import.meta.env.VITE_STORYBOOK_THEME as string | undefined) ?? 'light',
  },
  globalTypes: {
    theme: {
      description: 'Motyw panelu',
      toolbar: {
        title: 'Motyw',
        icon: 'circlehollow',
        dynamicTitle: true,
        items: [
          { value: 'light', title: 'Jasny', icon: 'sun' },
          { value: 'dark', title: 'Ciemny', icon: 'moon' },
        ],
      },
    },
  },
  parameters: {
    // An axe violation fails the story in the test run
    a11y: { test: 'error' },
    backgrounds: { disable: true },
    layout: 'padded',
  },
};

export default preview;
