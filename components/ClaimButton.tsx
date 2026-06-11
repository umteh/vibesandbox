'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

function getSb() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function ClaimButton({ listingId, listingTitle }: { listingId: string; listingTitle: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const sb = getSb();
    const { error: err } = await sb.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${siteUrl}/listings/${listingId}?claimed=true`,
        shouldCreateUser: true,
      },
    });

    setLoading(false);
    if (err) { setError(err.message); return; }
    setSent(true);
  }

  if (sent) {
    return (
      <div style={{ background: 'oklch(0.97 0.04 128)', border: '2px solid var(--ink)', borderRadius: 8, padding: 24, marginBottom: 28 }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Check your email</div>
        <p style={{ fontSize: 14, color: 'var(--text2)', margin: 0 }}>
          We sent a sign-in link to <strong>{email}</strong>. Click it to claim this listing and unlock the full score.
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: 'oklch(0.97 0.04 128)', border: '2px solid var(--ink)', borderRadius: 8, padding: 24, marginBottom: 28 }}>
      <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.01em' }}>
        Is this your app?
      </div>
      <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 16 }}>
        Claim it to unlock the full AI score breakdown, see buyer interest, and decide if you want to list it for sale.
      </p>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          style={{
            display: 'inline-block', padding: '10px 24px',
            background: 'var(--ink)', color: 'var(--accent)',
            border: '2px solid var(--ink)', borderRadius: 4,
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
            boxShadow: '3px 3px 0px oklch(0.3 0.04 128)',
          }}
        >
          Claim this listing →
        </button>
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="email"
            required
            autoFocus
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              flex: '1 1 200px', padding: '10px 14px',
              border: '2px solid var(--ink)', borderRadius: 4,
              fontSize: 14, fontFamily: 'inherit', outline: 'none',
              background: '#fff',
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: 'var(--ink)', color: 'var(--accent)',
              border: '2px solid var(--ink)', borderRadius: 4,
              fontWeight: 700, fontSize: 14, cursor: loading ? 'wait' : 'pointer',
              boxShadow: '3px 3px 0px oklch(0.3 0.04 128)',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Sending…' : 'Send claim link →'}
          </button>
          {error && <p style={{ width: '100%', margin: '4px 0 0', fontSize: 13, color: 'var(--red)' }}>{error}</p>}
        </form>
      )}
    </div>
  );
}
