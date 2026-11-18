'use client';

import { BulkActionBar } from '@ziarnista/ui/bulk-action-bar';
import { Button } from '@ziarnista/ui/button';
import { ConfirmDialog } from '@ziarnista/ui/confirm-dialog';
import { toast } from '@ziarnista/ui/toast';
import { useState } from 'react';
import { formatCount } from '@/lib/format';
import { useAppDispatch } from '@/store/hooks';
import { STATUS_LABELS } from './product-labels';
import { productsDeselected, type ProductSelection } from './product-selection-slice';
import {
  useBulkProductActionMutation,
  type BulkProductAction,
  type BulkProductResult,
} from './products-api';

const PRODUCTS = { one: 'produkt', few: 'produkty', many: 'produktów' };
/** Names shown in a dialog or a toast; the rest is "i jeszcze N" */
const NAMES_SHOWN = 3;

function listNames(names: readonly string[]): string {
  const shown = names.slice(0, NAMES_SHOWN).join(', ');
  const rest = names.length - NAMES_SHOWN;
  return rest > 0 ? `${shown} i jeszcze ${rest}` : shown;
}

type DialogCopy = {
  title: string;
  description: string;
  confirmLabel: string;
  variant: 'destructive' | 'primary';
};

function dialogCopy(action: BulkProductAction, names: string[], onOtherPages: number): DialogCopy {
  const count = formatCount(names.length, PRODUCTS);
  const which = `${listNames(names)}.${onOtherPages > 0 ? ` W tym ${onOtherPages} z innych stron listy.` : ''}`;

  if (action.type === 'archive') {
    return {
      title: `Zarchiwizować ${count}?`,
      description: `${which} Znikną ze sklepu, ale zostaną w panelu i w historii zamówień. Możesz je przywrócić, zmieniając status.`,
      confirmLabel: 'Archiwizuj',
      variant: 'destructive',
    };
  }
  const label = STATUS_LABELS[action.status];
  return {
    title: `Ustawić status „${label}”?`,
    description:
      action.status === 'ACTIVE'
        ? `Dotyczy: ${count} – ${which} Produkty bez aktywnego wariantu albo zdjęcia nie zostaną opublikowane i pozostaną zaznaczone.`
        : `Dotyczy: ${count} – ${which} Szkice nie są widoczne w sklepie.`,
    confirmLabel: `Ustaw „${label}”`,
    variant: 'primary',
  };
}

function successMessage(action: BulkProductAction, count: number): string {
  const products = formatCount(count, PRODUCTS);
  return action.type === 'archive'
    ? `Zarchiwizowano: ${products}.`
    : `Zmieniono status na „${STATUS_LABELS[action.status]}”: ${products}.`;
}

function failureMessage(failed: BulkProductResult['failed'], selection: ProductSelection): string {
  // The field issue says what to fix ("Dodaj zdjęcie"); the general message only that it failed
  const reasons = failed.slice(0, NAMES_SHOWN).map(({ id, error }) => {
    const reason = error.fieldIssues[0]?.message ?? error.message ?? 'serwer nie odpowiada';
    return `${selection[id] ?? id}: ${reason}`;
  });
  const rest = failed.length - NAMES_SHOWN;
  return [
    `Nie udało się: ${formatCount(failed.length, PRODUCTS)} (pozostają zaznaczone).`,
    ...reasons,
    ...(rest > 0 ? [`…i jeszcze ${rest}.`] : []),
  ].join(' ');
}

export type ProductBulkActionsProps = {
  selection: ProductSelection;
  onOtherPages: number;
  onClear: () => void;
};

export function ProductBulkActions({ selection, onOtherPages, onClear }: ProductBulkActionsProps) {
  const dispatch = useAppDispatch();
  const [runBulkAction, { isLoading }] = useBulkProductActionMutation();
  // The last action stays after closing, so the dialog keeps its text while it animates out
  const [action, setAction] = useState<BulkProductAction>({ type: 'archive' });
  const [isOpen, setIsOpen] = useState(false);

  function ask(next: BulkProductAction) {
    setAction(next);
    setIsOpen(true);
  }

  const ids = Object.keys(selection);
  const names = Object.values(selection);

  async function confirm() {
    const result = await runBulkAction({ ids, action }).unwrap();
    dispatch(productsDeselected(result.succeeded));
    setIsOpen(false);
    if (result.succeeded.length > 0) toast.success(successMessage(action, result.succeeded.length));
    if (result.failed.length > 0) toast.error(failureMessage(result.failed, selection));
  }

  const copy = dialogCopy(action, names, onOtherPages);

  return (
    <>
      <BulkActionBar count={ids.length} onClear={onClear}>
        {onOtherPages > 0 && (
          <span className="mr-2 text-caption text-muted-foreground">
            w tym {onOtherPages} na innych stronach
          </span>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => ask({ type: 'status', status: 'ACTIVE' })}
        >
          Ustaw jako aktywne
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => ask({ type: 'status', status: 'DRAFT' })}
        >
          Przenieś do szkiców
        </Button>
        <Button variant="destructive-outline" size="sm" onClick={() => ask({ type: 'archive' })}>
          Archiwizuj
        </Button>
      </BulkActionBar>
      <ConfirmDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        {...copy}
        loading={isLoading}
        onConfirm={() => void confirm()}
      />
    </>
  );
}
