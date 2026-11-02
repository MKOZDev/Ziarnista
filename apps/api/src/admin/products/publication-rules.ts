import type { FieldIssue } from '@ziarnista/shared';

export const PUBLISH_BLOCKED_MESSAGE = 'Nie można opublikować produktu';
export const LAST_ACTIVE_VARIANT_MESSAGE =
  'Nie można wyłączyć ostatniego aktywnego wariantu opublikowanego produktu. Najpierw zmień status na szkic.';

export type PublicationState = { activeVariants: number; images: number };

/**
 * What a product lacks to be ACTIVE: at least one active variant (something to buy, and a
 * minPrice) and one image. All problems at once, so the admin fixes them in one go.
 */
export function publicationIssues({ activeVariants, images }: PublicationState): FieldIssue[] {
  const issues: FieldIssue[] = [];
  if (activeVariants === 0) {
    issues.push({ path: 'variants', message: 'Dodaj co najmniej jeden aktywny wariant' });
  }
  if (images === 0) {
    issues.push({ path: 'images', message: 'Dodaj co najmniej jedno zdjęcie' });
  }
  return issues;
}
