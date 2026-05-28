'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface Props {
  mode: 'signin' | 'signup';
  onClose: () => void;
  onToggle: () => void;
  onAuth: (email: string) => void;
}

function getSb() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function AuthModal({ mode, onClose, onToggle, onAuth }: Props) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const sb = getSb();
    if (mode === 'signin') {
      const { data, error: err } = await sb.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (err) { setError(err.message); setLoading(false); return; }
      onAuth(data.user?.email ?? form.email);
    } else {
      const { data, error: err } = await sb.auth.signUp({
        email: form.email,
        password: form.password,
      });
      if (err) { setError(err.message); setLoading(false); return; }
      // If email confirmation is required, Supabase returns a user but no session
      if (!data.session) {
        setError('Check your email to confirm your account, then sign in.');
        setLoading(false);
        return;
      }
      onAuth(data.user?.email ?? form.email);
    }
    setLoading(false);
  }

  async function signInWithOAuth(provider: 'github' | 'google') {
    setError('');
    const sb = getSb();
    const { error: err } = await sb.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (err) setError(err.message);
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        className="animate-slide-up"
        style={{ background: '#fff', borderRadius: 'var(--radius-lg)', width: 420, boxShadow: 'var(--shadow-lg)' }}
      >
        <div style={{ padding: '24px 28px' }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>
              {mode === 'signin' ? 'Welcome back to VibeSandbox' : 'Join the AI builder community'}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 4 }}>
            <button
              type="button"
              onClick={() => signInWithOAuth('github')}
              style={{ width: '100%', padding: '10px 14px', background: '#0d1117', color: '#fff', border: '1.5px solid #0d1117', borderRadius: 8, fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Continue with GitHub
            </button>
            <button
              type="button"
              onClick={() => signInWithOAuth('google')}
              style={{ width: '100%', padding: '10px 14px', background: '#fff', color: '#3c4043', border: '1.5px solid #dadce0', borderRadius: 8, fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {error && (
            <div style={{ padding: '10px 12px', background: 'var(--red-light)', border: '1px solid var(--red)', borderRadius: 8, fontSize: 13, color: 'var(--text)', marginBottom: 12 }}>
              {error}
            </div>
          )}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {([['email', 'Email address', 'email'], ['password', 'Password', 'password']] as const).map(([id, ph, type]) => (
              <div key={id}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 4 }}>{ph}</label>
                <input
                  type={type}
                  name={id}
                  autoComplete={id === 'email' ? 'email' : mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                  placeholder={ph}
                  value={form[id]}
                  onChange={e => setForm(f => ({ ...f, [id]: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', background: 'var(--bg)' }}
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 4, padding: 11, background: 'var(--blue)', color: '#fff', borderRadius: 8,
                fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {loading ? (
                <>
                  <div className="animate-spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%' }} />
                  {mode === 'signin' ? 'Signing in…' : 'Creating account…'}
                </>
              ) : (mode === 'signin' ? 'Sign in' : 'Create account')}
            </button>
          </form>

          <div style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={onToggle} style={{ color: 'var(--blue)', fontWeight: 500 }}>
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
