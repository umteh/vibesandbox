'use client';

import { useState } from 'react';
import { Listing, priceDisplay } from '@/lib/data';
import Avatar from './Avatar';

interface Props {
  listing: Listing;
  onClose: () => void;
}

type State = 'idle' | 'sending' | 'sent' | 'duplicate' | 'error';

export default function ContactModal({ listing, onClose }: Props) {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [state, setState] = useState<State>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const price = priceDisplay(listing);

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

  return (
    <div className="overlay" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="animate-slide-up" style={{
        background: '#fff', borderRadius: 'var(--radius-lg)',
        width: 480, maxHeight: '90vh', overflow: 'auto', boxShadow: 'var(--shadow-lg)',
      }}>
        {state === 'sent' ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✉️</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Message sent</div>
            <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>
              Your inquiry has been forwarded to {listing.creator}. They&apos;ll reply directly to your email.
              Neither party is tracked after this relay.
            </p>
            <button onClick={onClose} style={{ marginTop: 24, padding: '10px 24px', background: 'var(--blue)', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 500 }}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar initials={listing.avatar} size={32} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Contact {listing.creator}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>re: {listing.title} · {price.label}</div>
                </div>
                <button onClick={onClose} style={{ marginLeft: 'auto', fontSize: 20, color: 'var(--text3)', lineHeight: 1 }}>×</button>
              </div>
            </div>

            <form onSubmit={submit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: '10px 14px', background: 'var(--bg2)', borderRadius: 8, fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, borderLeft: '3px solid var(--border2)' }}>
                Seller replies directly to your email. One relay, then it&apos;s between you two.
              </div>

              {state === 'duplicate' && (
                <div style={{ padding: '10px 14px', background: 'var(--amber-light)', border: '1px solid var(--amber)', borderRadius: 8, fontSize: 13, color: 'var(--text2)' }}>
                  Your message was already sent. No duplicate email will be forwarded.
                </div>
              )}
              {state === 'error' && (
                <div style={{ padding: '10px 14px', background: 'var(--red-light)', border: '1px solid var(--red)', borderRadius: 8, fontSize: 13, color: 'var(--text)' }}>
                  {errorMsg}
                </div>
              )}

              {([['name', 'Your name', 'text'], ['email', 'Your email', 'email']] as const).map(([id, ph, type]) => (
                <div key={id}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 5 }}>
                    {ph} <span style={{ color: 'var(--red)' }}>*</span>
                  </label>
                  <input type={type} required placeholder={ph} value={form[id]}
                    onChange={e => setForm(f => ({ ...f, [id]: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', background: 'var(--bg)' }} />
                </div>
              ))}

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 5 }}>
                  Message <span style={{ color: 'var(--red)' }}>*</span>
                </label>
                <textarea required rows={4}
                  placeholder={`Hi, I'm interested in buying. My budget is around $X. Are you open to a call or can you share more details?`}
                  value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical', background: 'var(--bg)' }} />
              </div>

              <button type="submit" disabled={state === 'sending'} style={{
                padding: 11, background: 'var(--blue)', color: '#fff', borderRadius: 8,
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
          </>
        )}
      </div>
    </div>
  );
}
