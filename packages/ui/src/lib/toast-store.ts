// A store outside React, so toasts can also be raised from code without hooks (e.g. API middleware)

export type ToastVariant = 'success' | 'error';

export type ToastItem = {
  id: number;
  variant: ToastVariant;
  message: string;
  duration: number;
};

type ToastOptions = { duration?: number };

type ToastState = {
  toasts: readonly ToastItem[];
  /** The open modal, if any: toasts must render inside it to stay visible and usable */
  host: HTMLElement | null;
};

export const SUCCESS_TOAST_DURATION = 5000;
// Longer: an error usually has to be read and acted on
export const ERROR_TOAST_DURATION = 8000;

const SERVER_STATE: ToastState = { toasts: [], host: null };

let state = SERVER_STATE;
let hosts: readonly HTMLElement[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function setState(next: Partial<ToastState>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

export function subscribeToToasts(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getToastState() {
  return state;
}

export function getServerToastState() {
  return SERVER_STATE;
}

function addToast(variant: ToastVariant, message: string, duration: number) {
  const id = nextId++;
  setState({ toasts: [...state.toasts, { id, variant, message, duration }] });
  return id;
}

export const toast = {
  success: (message: string, options: ToastOptions = {}) =>
    addToast('success', message, options.duration ?? SUCCESS_TOAST_DURATION),
  error: (message: string, options: ToastOptions = {}) =>
    addToast('error', message, options.duration ?? ERROR_TOAST_DURATION),
};

export function dismissToast(id: number) {
  setState({ toasts: state.toasts.filter((item) => item.id !== id) });
}

export function clearToasts() {
  setState({ toasts: [] });
}

/** Modals can be nested, so the most recently opened one wins. Returns the release function. */
export function pushToastHost(element: HTMLElement) {
  hosts = [...hosts, element];
  setState({ host: element });

  return () => {
    hosts = hosts.filter((host) => host !== element);
    setState({ host: hosts.at(-1) ?? null });
  };
}
