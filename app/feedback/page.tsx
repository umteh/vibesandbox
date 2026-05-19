'use client';

import { useState } from 'react';
import Link from 'next/link';

type FeedbackType = 'Bug' | 'Feature' | 'General';

export default function FeedbackPage() {
  const [form, setForm] = useState({ type: 'General' as FeedbackType, message: '', email: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState('sending');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setState('sent');
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error ?? 'Something went wrong.');
        setState('error');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setState('error');
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav style={{ borderBottom: '1px solid var(--border)', background: 'oklch(0.985 0.004 80 / 0.92)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/feed" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo.png" alt="VibeSandbox" style={{ height: 25, width: 'auto', display: 'block' }} />
          </Link>
          <span style={{ fontSize: 13, color: 'var(--text3)' }}>·</span>
          <Link href="/feed" style={{ fontSize: 13, color: 'var(--text3)', textDecoration: 'none' }}>← Back to feed</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '60px 24px 80px' }}>
        {state === 'sent' ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 12, background: 'var(--accent)',
              border: '2px solid var(--ink)', boxShadow: '3px 3px 0px var(--ink)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', fontSize: 24,
            }}>✓</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Thanks for the feedback</div>
            <p style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 28 }}>We read every submission.</p>
            <Link href="/feed" style={{
              display: 'inline-block', padding: '10px 24px',
              background: 'var(--ink)', color: 'var(--accent)',
              borderRadius: 4, fontSize: 14, fontWeight: 700, textDecoration: 'none',
              boxShadow: '2px 2px 0px var(--accent-dark)',
            }}>← Back to feed</Link>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 36 }}>
              <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>Feedback</h1>
              <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.7 }}>
                Bug, feature request, or just a thought — we read everything.
              </p>
            </div>

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Type */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>Type</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['Bug', 'Feature', 'General'] as FeedbackType[]).map(t => (
                    <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t }))} style={{
                      flex: 1, padding: '8px 4px', borderRadius: 4, fontSize: 13, fontWeight: 700,
                      border: `2px solid ${form.type === t ? 'var(--ink)' : 'var(--border2)'}`,
                      background: form.type === t ? 'var(--ink)' : 'transparent',
                      color: form.type === t ? 'var(--accent)' : 'var(--text2)',
                      transition: 'all 0.12s ease',
                    }}>{t}</button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>
                  Message <span style={{ color: 'var(--red)' }}>*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder={
                    form.type === 'Bug' ? 'What happened? What did you expect?' :
                    form.type === 'Feature' ? 'What would you like to see?' :
                    'What\'s on your mind?'
                  }
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '2px solid var(--border2)', borderRadius: 4, fontSize: 14, outline: 'none', resize: 'vertical', background: '#fff', lineHeight: 1.6 }}
                />
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>
                  Email <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text3)' }}>(optional — if you want a reply)</span>
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '2px solid var(--border2)', borderRadius: 4, fontSize: 14, outline: 'none', background: '#fff' }}
                />
              </div>

              {state === 'error' && (
                <div style={{ padding: '10px 14px', background: 'var(--red-light)', border: '1px solid var(--red)', borderRadius: 6, fontSize: 13, color: 'var(--text)' }}>
                  {errorMsg || 'Something went wrong. Try again.'}
                </div>
              )}

              <button type="submit" disabled={state === 'sending'} style={{
                padding: '12px', background: 'var(--ink)', color: 'var(--accent)',
                borderRadius: 4, fontSize: 14, fontWeight: 700, border: '2px solid var(--ink)',
                boxShadow: '2px 2px 0px var(--accent-dark)',
                opacity: state === 'sending' ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                {state === 'sending' ? (
                  <><div className="animate-spin" style={{ width: 14, height: 14, border: '2px solid oklch(0.4 0.19 128)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} />Sending…</>
                ) : 'Send feedback'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
