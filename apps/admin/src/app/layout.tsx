import type { Metadata } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import { Toaster } from '@ziarnista/ui/toast';
import { THEME_INIT_SCRIPT } from '@/features/theme/theme-script';
import { Providers } from './providers';
import './globals.css';

// latin-ext is required for Polish characters (ą, ę, ł, ż...)
const fraunces = Fraunces({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-fraunces',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Ziarnista — panel', template: '%s — Ziarnista panel' },
  // The admin panel must never be indexed
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: THEME_INIT_SCRIPT adds .dark here before React hydrates.
    // It only applies to this element's own attributes, not to its children.
    <html lang="pl" className={`${fraunces.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
