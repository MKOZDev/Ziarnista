import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearToasts,
  dismissToast,
  ERROR_TOAST_DURATION,
  getServerToastState,
  getToastState,
  pushToastHost,
  subscribeToToasts,
  SUCCESS_TOAST_DURATION,
  toast,
} from './toast-store';

const element = (name: string) => ({ name }) as unknown as HTMLElement;

afterEach(clearToasts);

describe('toast store', () => {
  it('adds toasts in order with their variant', () => {
    toast.success('Zapisano');
    toast.error('Błąd');
    expect(getToastState().toasts.map(({ variant, message }) => [variant, message])).toEqual([
      ['success', 'Zapisano'],
      ['error', 'Błąd'],
    ]);
  });

  it('keeps every toast on screen for at least 5 seconds by default', () => {
    toast.success('Zapisano');
    toast.error('Błąd');
    expect(getToastState().toasts.map(({ duration }) => duration)).toEqual([
      SUCCESS_TOAST_DURATION,
      ERROR_TOAST_DURATION,
    ]);
    expect(SUCCESS_TOAST_DURATION).toBeGreaterThanOrEqual(5000);
    expect(ERROR_TOAST_DURATION).toBeGreaterThan(SUCCESS_TOAST_DURATION);
  });

  it('accepts a custom duration', () => {
    toast.error('Błąd', { duration: 100 });
    expect(getToastState().toasts[0]?.duration).toBe(100);
  });

  it('removes only the dismissed toast', () => {
    const first = toast.success('Pierwszy');
    toast.success('Drugi');
    dismissToast(first);
    expect(getToastState().toasts.map(({ message }) => message)).toEqual(['Drugi']);
  });

  it('notifies subscribers until they unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToToasts(listener);
    toast.success('Zapisano');
    expect(listener).toHaveBeenCalledOnce();

    unsubscribe();
    toast.success('Znowu');
    expect(listener).toHaveBeenCalledOnce();
  });

  it('never exposes client toasts as the server snapshot', () => {
    toast.success('Zapisano');
    expect(getServerToastState().toasts).toEqual([]);
  });

  it('returns a new snapshot only when something changed', () => {
    const before = getToastState();
    expect(getToastState()).toBe(before);
    toast.success('Zapisano');
    expect(getToastState()).not.toBe(before);
  });
});

describe('toast host', () => {
  it('uses the most recently opened modal and falls back when it closes', () => {
    const outer = element('outer');
    const inner = element('inner');

    const releaseOuter = pushToastHost(outer);
    const releaseInner = pushToastHost(inner);
    expect(getToastState().host).toBe(inner);

    releaseInner();
    expect(getToastState().host).toBe(outer);

    releaseOuter();
    expect(getToastState().host).toBeNull();
  });

  it('handles modals closing out of order', () => {
    const outer = element('outer');
    const inner = element('inner');

    const releaseOuter = pushToastHost(outer);
    const releaseInner = pushToastHost(inner);

    releaseOuter();
    expect(getToastState().host).toBe(inner);

    releaseInner();
    expect(getToastState().host).toBeNull();
  });
});
