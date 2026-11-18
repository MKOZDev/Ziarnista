import { EmptyState } from '@ziarnista/ui/empty-state';
import { PageHeader } from '@ziarnista/ui/page-header';

/** A target page of the navigation whose module is not built yet. */
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} />
      <EmptyState title="Ten moduł jest w budowie" description="Pojawi się w kolejnym etapie." />
    </>
  );
}
