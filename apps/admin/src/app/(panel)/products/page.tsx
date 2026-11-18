import { LoadingState } from '@ziarnista/ui/loading-state';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProductListPage } from '@/features/products/product-list-page';

export const metadata: Metadata = { title: 'Produkty' };

export default function ProductsPage() {
  // useSearchParams needs a Suspense boundary: without it Next.js renders the whole page
  // on the client only, and the build fails for a statically rendered route
  return (
    <Suspense fallback={<LoadingState />}>
      <ProductListPage />
    </Suspense>
  );
}
