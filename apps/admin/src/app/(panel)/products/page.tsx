import type { Metadata } from 'next';
import { PlaceholderPage } from '@/components/placeholder-page';

export const metadata: Metadata = { title: 'Produkty' };

export default function ProductsPage() {
  return <PlaceholderPage title="Produkty" />;
}
