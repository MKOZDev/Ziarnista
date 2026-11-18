import type { BadgeProps } from '@ziarnista/ui/badge';
import type { AdminProductSort, ProductKind, ProductStatus } from '@ziarnista/shared';

// Polish UI texts for the API's enums, in one place for the list, filters and form

export const STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: 'Szkic',
  ACTIVE: 'Aktywny',
  ARCHIVED: 'Zarchiwizowany',
};

/** A draft needs attention before it sells; an archived product is out of the way */
export const STATUS_BADGES: Record<ProductStatus, NonNullable<BadgeProps['variant']>> = {
  DRAFT: 'warning',
  ACTIVE: 'success',
  ARCHIVED: 'neutral',
};

export const KIND_LABELS: Record<ProductKind, string> = {
  COFFEE: 'Kawa',
  ACCESSORY: 'Akcesorium',
};

export const SORT_LABELS: Record<AdminProductSort, string> = {
  updated: 'Ostatnio zmienione',
  newest: 'Najnowsze',
  name: 'Nazwa A–Z',
  name_desc: 'Nazwa Z–A',
  price_asc: 'Cena rosnąco',
  price_desc: 'Cena malejąco',
};
