'use client';

import { useRef, type ReactNode } from 'react';
import { Button } from './button';
import { Modal } from './modal';

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: ReactNode;
  /** Name the action ("Anuluj zamówienie"), not a generic "OK" */
  confirmLabel: string;
  /** "Wróć" by default, so it cannot be confused with a confirm label like "Anuluj zamówienie" */
  cancelLabel?: string;
  /** Does not close the dialog: the parent closes it once the action has succeeded */
  onConfirm: () => void;
  /** Action in progress: blocks confirming again and every way of closing */
  loading?: boolean;
  variant?: 'destructive' | 'primary';
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Wróć',
  onConfirm,
  loading = false,
  variant = 'destructive',
}: ConfirmDialogProps) {
  // Focus starts on the safe option, so a stray Enter cannot trigger the action
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <Modal
      role="alertdialog"
      open={open}
      onOpenChange={(next) => {
        if (!loading) onOpenChange(next);
      }}
      title={title}
      description={description}
      initialFocusRef={cancelRef}
      footer={
        <>
          <Button
            ref={cancelRef}
            variant="secondary"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button variant={variant} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
