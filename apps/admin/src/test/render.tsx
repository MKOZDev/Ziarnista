import { Toaster } from '@ziarnista/ui/toast';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@/features/theme/theme-context';
import { makeStore } from '@/store/store';

/** Same providers as the real app, with a fresh store per test. */
export function renderWithProviders(ui: ReactElement) {
  const store = makeStore();
  const result = render(
    <Provider store={store}>
      <ThemeProvider>{ui}</ThemeProvider>
      <Toaster />
    </Provider>,
  );
  return { ...result, store };
}
