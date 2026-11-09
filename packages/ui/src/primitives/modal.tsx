'use client';

import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
  type RefObject,
  type SyntheticEvent,
} from 'react';
import { cn } from '../lib/cn';
import { PortalContainerProvider } from '../lib/portal-container';

export type ModalProps = {
  open: boolean;
  /** Called with false on Esc or a backdrop click. The parent decides whether it really closes. */
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** alertdialog is for confirmations: a backdrop click must not close it */
  role?: 'dialog' | 'alertdialog';
  /** Receives focus on open; by default the browser focuses the first focusable element */
  initialFocusRef?: RefObject<HTMLElement | null>;
  className?: string;
};

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  role = 'dialog',
  initialFocusRef,
  className,
}: ModalProps) {
  // State, not a ref: children need the element as their portal target during render
  const [dialog, setDialog] = useState<HTMLDialogElement | null>(null);
  const pressStartedOnBackdrop = useRef(false);
  const titleId = useId();
  const descriptionId = useId();

  // Layout effect: its cleanup runs before the element is removed. Closing a dialog that is
  // already detached would not return focus to the element that opened it.
  useLayoutEffect(() => {
    if (!dialog || !open) return;
    dialog.showModal();
    initialFocusRef?.current?.focus();
    return () => dialog.close();
  }, [dialog, open, initialFocusRef]);

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    // cancel also bubbles from file inputs inside the dialog
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    onOpenChange(false);
  }

  // Chrome skips cancel on a repeated Esc and closes the dialog directly. The open prop stays the
  // source of truth: restore the dialog, then let the parent decide as for any other close.
  function handleClose() {
    if (!open || !dialog || dialog.open) return;
    dialog.showModal();
    onOpenChange(false);
  }

  function handleMouseDown(event: MouseEvent<HTMLDialogElement>) {
    pressStartedOnBackdrop.current = event.target === event.currentTarget;
  }

  function handleClick(event: MouseEvent<HTMLDialogElement>) {
    // Checking where the press started: selecting text and releasing outside is not a dismissal
    const isBackdropClick = pressStartedOnBackdrop.current && event.target === event.currentTarget;
    if (role === 'dialog' && isBackdropClick) onOpenChange(false);
  }

  return (
    <dialog
      ref={setDialog}
      data-slot="modal"
      role={role}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className={cn(
        // m-auto: Tailwind's reset removes the browser's centering of <dialog>
        'm-auto w-[calc(100%-3rem)] max-w-105 rounded-xl border bg-card text-card-foreground shadow-lg backdrop:bg-overlay',
        className,
      )}
      onCancel={handleCancel}
      onClose={handleClose}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {/* Padding lives here, so a click on the dialog element itself can only be the backdrop */}
      <div className="flex flex-col gap-4 p-6">
        <PortalContainerProvider value={dialog}>
          <div className="flex flex-col gap-2">
            <h2 id={titleId} className="text-title font-semibold">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="text-body text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {children}
          {footer && <div className="flex justify-end gap-2">{footer}</div>}
        </PortalContainerProvider>
      </div>
    </dialog>
  );
}
