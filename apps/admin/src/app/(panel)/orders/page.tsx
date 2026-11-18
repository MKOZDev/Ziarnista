import type { Metadata } from 'next';
import { PlaceholderPage } from '@/components/placeholder-page';

export const metadata: Metadata = { title: 'Zamówienia' };

export default function OrdersPage() {
  return <PlaceholderPage title="Zamówienia" />;
}
