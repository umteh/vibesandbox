import type { Metadata } from 'next';
import { DM_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
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
  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={dmMono.variable}>
      <head></head>
      <body>{children}<Analytics /></body>
    </html>
  );
}
