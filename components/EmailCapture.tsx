'use client';

import { useState } from 'react';

type State = 'idle' | 'submitting' | 'success' | 'error';

export default function EmailCapture() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<State>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setState('success');
      } else {
        setState('error');
        setErrorMsg(data.error ?? 'Something went wrong, try again.');
      }
    } catch {
      setState('error');
      setErrorMsg('Network error. Check your connection.');
    }
  }

  if (state === 'success') {
    return (
      <div style={{ borderTop: '2px solid var(--border2)', padding: '32px 24px', textAlign: 'center', background: 'var(--bg)' }}>
        <span style={{ fontSize: 14, color: 'var(--green)', fontWeight: 700 }}>✓ You&apos;re on the list</span>
      </div>
    );
  }

  return (
    <div style={{ borderTop: '2px solid var(--border2)', background: 'var(--bg)', padding: '32px 24px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Get notified when new apps are listed</div>
        <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>No spam. Just new AI apps worth knowing about.</p>
        <form onSubmit={submit} style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <input
            type="email"
            required
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              flex: 1, maxWidth: 280, padding: '9px 12px',
              border: '2px solid var(--ink)', borderRadius: 0,
              fontSize: 13, outline: 'none', background: '#fff',
            }}
          />
          <button
            type="submit"
            disabled={state === 'submitting'}
            style={{
              padding: '9px 18px', background: 'var(--ink)', color: 'var(--accent)',
              border: '2px solid var(--ink)', fontSize: 12, fontWeight: 700,
              opacity: state === 'submitting' ? 0.7 : 1, cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {state === 'submitting' ? 'Subscribing…' : 'Notify me'}
          </button>
        </form>
        {state === 'error' && (
          <p style={{ marginTop: 8, fontSize: 12, color: 'var(--red)' }}>{errorMsg}</p>
        )}
      </div>
    </div>
  );
}
