import type { Metadata } from 'next';
import { DM_Mono } from 'next/font/google';
import './globals.css';

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VibeSandbox — AI App Marketplace',
  description: 'Every listing scored by AI across 5 dimensions. Builders sell. Buyers discover. No payment processing.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={dmMono.variable}>
      <head></head>
      <body>{children}</body>
    </html>
  );
}
