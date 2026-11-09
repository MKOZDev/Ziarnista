import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';
import { controlClasses } from '../lib/control';

export function Textarea({ rows = 4, className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      rows={rows}
      className={cn('w-full min-w-0 resize-y px-3 py-2.5', controlClasses, className)}
      {...props}
    />
  );
}
