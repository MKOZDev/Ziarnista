import { cn } from '../lib/cn';
import { Skeleton } from './skeleton';

export type LoadingStateProps = {
  variant?: 'list' | 'dashboard';
  rows?: number;
  className?: string;
};

export function LoadingState({ variant = 'list', rows = 6, className }: LoadingStateProps) {
  return (
    <div data-slot="loading-state" aria-busy className={cn('flex flex-col gap-4', className)}>
      <p role="status" className="sr-only">
        Wczytywanie danych…
      </p>

      {variant === 'dashboard' && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-lg border bg-card p-5">
        <Skeleton shape="line" className="w-44" />
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-3">
            <Skeleton className="size-10 shrink-0 rounded-md" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton shape="line" className="w-3/5" />
              <Skeleton shape="line" className="h-2 w-1/4" />
            </div>
            <Skeleton shape="pill" className="w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
