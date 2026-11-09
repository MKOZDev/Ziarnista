'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { getPageItems } from '../lib/pagination';
import { Button } from './button';
import { IconButton, UNAVAILABLE_ICON_BUTTON } from './icon-button';

export type PaginationProps = Omit<ComponentProps<'div'>, 'onChange'> & {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

type StepButtonProps = {
  label: string;
  isUnavailable: boolean;
  onStep: () => void;
  children: ReactNode;
};

function StepButton({ label, isUnavailable, onStep, children }: StepButtonProps) {
  return (
    <IconButton
      size="sm"
      aria-label={label}
      // aria-disabled, not disabled: reaching the last page must not drop keyboard focus
      aria-disabled={isUnavailable || undefined}
      className={UNAVAILABLE_ICON_BUTTON}
      onClick={isUnavailable ? undefined : onStep}
    >
      {children}
    </IconButton>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  className,
  ...props
}: PaginationProps) {
  const pageCount = Math.ceil(total / pageSize);
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <div
      data-slot="pagination"
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 text-label text-muted-foreground',
        className,
      )}
      {...props}
    >
      <span className="tabular-nums">
        {rangeStart}–{rangeEnd} z {total}
      </span>

      {pageCount > 1 && (
        <nav aria-label="Paginacja">
          <ul className="flex items-center gap-1">
            <li>
              <StepButton
                label="Poprzednia strona"
                isUnavailable={page <= 1}
                onStep={() => onPageChange(page - 1)}
              >
                <ChevronLeft aria-hidden />
              </StepButton>
            </li>

            {getPageItems(page, pageCount).map((item, index) =>
              item === 'gap' ? (
                <li key={`gap-${index}`} aria-hidden className="w-control-sm text-center">
                  …
                </li>
              ) : (
                <li key={item}>
                  <Button
                    variant="secondary"
                    size="sm"
                    aria-label={`Strona ${item}`}
                    aria-current={item === page ? 'page' : undefined}
                    className="min-w-control-sm px-2 tabular-nums aria-[current=page]:border-primary aria-[current=page]:bg-primary-soft aria-[current=page]:text-primary-ink"
                    onClick={() => onPageChange(item)}
                  >
                    {item}
                  </Button>
                </li>
              ),
            )}

            <li>
              <StepButton
                label="Następna strona"
                isUnavailable={page >= pageCount}
                onStep={() => onPageChange(page + 1)}
              >
                <ChevronRight aria-hidden />
              </StepButton>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
