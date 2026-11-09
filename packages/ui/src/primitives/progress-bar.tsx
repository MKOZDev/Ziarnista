import { cn } from '../lib/cn';

export type ProgressBarProps = {
  /** Percent; values outside 0–100 are clamped */
  value: number;
  'aria-label': string;
  className?: string;
};

// A meter, not a progressbar: it shows a share of a whole, not a task in progress
export function ProgressBar({ value, 'aria-label': ariaLabel, className }: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, value));

  return (
    <div
      data-slot="progress-bar"
      role="meter"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      className={cn('h-1.5 overflow-hidden rounded-full bg-muted', className)}
    >
      <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
    </div>
  );
}
