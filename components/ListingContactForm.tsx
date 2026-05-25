'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Listing } from '@/lib/data';

interface Props {
  listing: Listing;
}

type State = 'idle' | 'sending' | 'sent' | 'duplicate' | 'error';

export default function ListingContactForm({ listing }: Props) {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [state, setState] = useState<State>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    const sb = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const email = data.user.email ?? '';
      const { data: profile } = await sb
        .from('profiles')
        .select('display_name')
        .eq('id', data.user.id)
        .single();
      const name = profile?.display_name || email.split('@')[0];
      setForm(f => ({
        ...f,
        name: f.name || name,
        email: f.email || email,
      }));
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState('sending');
    setErrorMsg('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: listing.id,
          buyer_name: form.name,
          buyer_email: form.email,
          message: form.message,
        }),
      });

      const data = await res.json();

      if (res.status === 200 && data.message?.includes('already sent')) {
        setState('duplicate');
        return;
      }
      if (res.status === 410) {
        setState('error');
        setErrorMsg('This contact link has expired.');
        return;
      }
      if (!res.ok) {
        setState('error');
        setErrorMsg(data.error ?? 'Failed to send. Please try again.');
        return;
      }

      setState('sent');
    } catch {
      setState('error');
      setErrorMsg('Network error. Please check your connection.');
    }
  }

  if (state === 'sent') {
    return (
      <div style={{ background: 'var(--green-light)', border: '1px solid var(--green)', borderRadius: 12, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>✉️</div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Message sent</div>
        <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>
          Your inquiry has been forwarded to {listing.creator}. They&apos;ll reply directly to your email.
          Neither party is tracked after this relay.
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>Contact Seller</div>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>
        No login required. Your message is relayed once to the seller&apos;s email. The link expires in 24h.
      </p>

      {state === 'duplicate' && (
        <div style={{ padding: '10px 14px', background: 'var(--amber-light)', border: '1px solid var(--amber)', borderRadius: 8, fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>
          Your message was already sent. No duplicate email will be forwarded.
        </div>
      )}
      {state === 'error' && (
        <div style={{ padding: '10px 14px', background: 'var(--red-light)', border: '1px solid var(--red)', borderRadius: 8, fontSize: 13, color: 'var(--text)', marginBottom: 14 }}>
          {errorMsg}
        </div>
      )}

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {([['name', 'Your name', 'text'], ['email', 'Your email', 'email']] as const).map(([id, ph, type]) => (
          <div key={id}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 5 }}>
              {ph} <span style={{ color: 'var(--red)' }}>*</span>
            </label>
            <input type={type} required placeholder={ph} value={form[id]}
              onChange={e => setForm(f => ({ ...f, [id]: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff' }} />
          </div>
        ))}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 5 }}>
            Message <span style={{ color: 'var(--red)' }}>*</span>
          </label>
          <textarea required rows={4}
            placeholder={`Hi ${listing.creator}, I'm interested in ${listing.title}...`}
            value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical', background: '#fff' }} />
        </div>
        <button type="submit" disabled={state === 'sending'} style={{
          padding: 12, background: 'var(--blue)', color: '#fff', borderRadius: 9,
          fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 8, opacity: state === 'sending' ? 0.7 : 1, transition: 'opacity 0.2s',
        }}>
          {state === 'sending' ? (
            <><div className="animate-spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%' }} />Sending…</>
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/send-mail.svg" alt="" style={{ width: 18, height: 18, filter: 'brightness(0) invert(1)' }} />
              Send inquiry
            </>
          )}
        </button>
      </form>
    </div>
  );
}
