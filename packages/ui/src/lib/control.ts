// Shared look of form controls, so Input, Textarea and Select cannot drift apart

export const controlClasses =
  'rounded-md border border-input bg-card text-body text-foreground transition-colors duration-(--duration-fast) placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive';

export const controlSizes = {
  sm: 'h-control-sm',
  md: 'h-control-md',
  lg: 'h-control-lg',
} as const;
