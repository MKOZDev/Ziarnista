import { cn } from '../lib/cn';
import { getInitials } from '../lib/initials';

export type ThumbnailProps = {
  /** Source of the placeholder initials */
  name: string;
  src?: string | null;
  /** Leave empty when the name is already written next to the thumbnail */
  alt?: string;
  className?: string;
};

const BASE = 'size-10 shrink-0 rounded-md';

export function Thumbnail({ name, src, alt = '', className }: ThumbnailProps) {
  if (src) {
    return (
      <img
        data-slot="thumbnail"
        src={src}
        alt={alt}
        loading="lazy"
        className={cn(BASE, 'object-cover', className)}
      />
    );
  }

  const a11yProps = alt ? { role: 'img', 'aria-label': alt } : { 'aria-hidden': true };

  return (
    <span
      data-slot="thumbnail"
      className={cn(
        BASE,
        'inline-grid place-items-center bg-muted text-caption font-semibold text-muted-foreground',
        className,
      )}
      {...a11yProps}
    >
      {getInitials(name)}
    </span>
  );
}
