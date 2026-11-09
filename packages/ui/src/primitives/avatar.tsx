import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => Array.from(word)[0]?.toLocaleUpperCase('pl') ?? '')
    .join('');
}

export type AvatarProps = Omit<ComponentProps<'span'>, 'children'> & {
  name: string;
  // Set when the name is already written next to the avatar, so it is not announced twice
  decorative?: boolean;
};

export function Avatar({ name, decorative = false, className, ...props }: AvatarProps) {
  const a11yProps = decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': name };

  return (
    <span
      data-slot="avatar"
      className={cn(
        'inline-grid size-8.5 shrink-0 place-items-center rounded-full bg-primary-soft text-label font-semibold text-primary-ink',
        className,
      )}
      {...a11yProps}
      {...props}
    >
      {getInitials(name)}
    </span>
  );
}
