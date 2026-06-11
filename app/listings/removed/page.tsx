import Link from 'next/link';

export default function ListingRemovedPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 480, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.02em' }}>Listing removed</h1>
        <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 28 }}>
          Your app has been removed from VibeSandbox. You won&apos;t receive further emails about it.
        </p>
        <Link href="/feed" style={{
          display: 'inline-block', padding: '10px 24px',
          background: 'var(--ink)', color: 'var(--accent)',
          border: '2px solid var(--ink)', borderRadius: 4,
          fontWeight: 700, fontSize: 14, textDecoration: 'none',
          boxShadow: '3px 3px 0px var(--ink)',
        }}>
          Back to VibeSandbox
        </Link>
      </div>
    </div>
  );
}
