import type { Metadata } from 'next';
import { PlaceholderPage } from '@/components/placeholder-page';

export const metadata: Metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  return <PlaceholderPage title="Dashboard" />;
}
