'use client';

import { CircleAlert, CircleCheck, X } from 'lucide-react';
import { Toast as ToastPrimitive } from 'radix-ui';
import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import {
  dismissToast,
  getServerToastState,
  getToastState,
  subscribeToToasts,
  type ToastItem,
} from '../lib/toast-store';

export { toast } from '../lib/toast-store';

// The rest waits in the queue, so a burst of errors cannot cover the page
const MAX_VISIBLE_TOASTS = 3;

function Toast({ item }: { item: ToastItem }) {
  const isError = item.variant === 'error';
  const Icon = isError ? CircleAlert : CircleCheck;

  return (
    <ToastPrimitive.Root
      data-slot="toast"
      // foreground = assertive announcement, background = polite
      type={isError ? 'foreground' : 'background'}
      duration={item.duration}
      defaultOpen
      onOpenChange={(open) => {
        if (!open) dismissToast(item.id);
      }}
      className="flex animate-toast-in items-start gap-2.5 rounded-lg bg-foreground py-3 pr-2 pl-4 text-body font-medium text-background shadow-lg"
    >
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <ToastPrimitive.Description className="min-w-0 flex-1">
        {item.message}
      </ToastPrimitive.Description>
      <ToastPrimitive.Close
        aria-label="Zamknij powiadomienie"
        className="grid size-6 shrink-0 cursor-pointer place-items-center rounded-sm transition-colors duration-(--duration-fast) hover:bg-background/20 focus-visible:outline-background"
      >
        <X aria-hidden className="size-4" />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
}

/** Render once, in the root layout. Raise toasts with `toast.success()` and `toast.error()`. */
export function Toaster() {
  const { toasts, host } = useSyncExternalStore(
    subscribeToToasts,
    getToastState,
    getServerToastState,
  );

  const viewport = (
    <ToastPrimitive.Viewport
      label="Powiadomienia ({hotkey})"
      className="fixed right-6 bottom-6 z-60 flex w-[calc(100%-3rem)] max-w-sm flex-col gap-2"
    />
  );

  return (
    <ToastPrimitive.Provider
      label="Powiadomienie"
      swipeDirection="right"
      // Announcements from <body> would be silenced too, since a modal makes it inert
      announcerContainer={host ?? undefined}
    >
      {toasts.slice(0, MAX_VISIBLE_TOASTS).map((item) => (
        <Toast key={item.id} item={item} />
      ))}
      {host ? createPortal(viewport, host) : viewport}
    </ToastPrimitive.Provider>
  );
}
