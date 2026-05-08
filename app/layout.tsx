import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VibeSandbox — AI App Marketplace',
  description: 'Every listing scored by AI across 5 dimensions. Builders sell. Buyers discover. No payment processing.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head></head>
      <body>{children}</body>
    </html>
  );
}
