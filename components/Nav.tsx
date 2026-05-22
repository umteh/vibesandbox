'use client';

import { useState, useRef, useEffect } from 'react';

interface Props {
  user: string | null;
  search: string;
  onSearchChange: (v: string) => void;
  onSignIn: () => void;
  onSignUp: () => void;
  onSignOut: () => void;
  onSubmit: () => void;
  onUserChange?: (name: string) => void;
}

export default function Nav({ user, search, onSearchChange, onSignIn, onSignUp, onSignOut, onSubmit, onUserChange }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setEditingName(false);
        setNameError('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function saveName() {
    if (!newName.trim()) { setNameError('Name cannot be empty'); return; }
    setSaving(true);
    setNameError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ display_name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setNameError(data.error ?? 'Update failed'); return; }
      onUserChange?.(newName.trim());
      setEditingName(false);
      setDropdownOpen(false);
    } catch {
      setNameError('Network error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'oklch(0.985 0.004 80 / 0.92)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/logo.png" alt="VibeSandbox" style={{ height: 25, width: 'auto', display: 'block' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
          {!user ? (
            <>
              <button onClick={onSignIn} style={{ padding: '7px 14px', fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>Sign in</button>
              <button onClick={onSignUp} style={{ padding: '7px 14px', fontSize: 13, fontWeight: 700, color: 'var(--text)', border: '2px solid var(--text)', borderRadius: 4, background: 'transparent' }}>Sign up</button>
            </>
          ) : (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 4, fontSize: 13, fontWeight: 600,
                  border: '2px solid var(--border2)', background: '#fff', color: 'var(--text)',
                  cursor: 'pointer',
                }}
              >
                {user}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2"
                  style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                  <path d="M2 3.5l3 3 3-3" />
                </svg>
              </button>

              {dropdownOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', right: 0, minWidth: 200,
                  background: '#fff', border: '2px solid var(--ink)', borderRadius: 4,
                  boxShadow: '3px 3px 0px var(--ink)', zIndex: 100, overflow: 'hidden',
                }}>
                  {editingName ? (
                    <div style={{ padding: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 6 }}>Display name</div>
                      <input
                        autoFocus
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveName()}
                        placeholder={user ?? ''}
                        style={{ width: '100%', padding: '7px 10px', border: '2px solid var(--border2)', borderRadius: 4, fontSize: 13, outline: 'none', marginBottom: 6 }}
                      />
                      {nameError && <div style={{ fontSize: 11, color: 'var(--red)', marginBottom: 6 }}>{nameError}</div>}
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => { setEditingName(false); setNameError(''); }} style={{ flex: 1, padding: '6px', fontSize: 12, fontWeight: 600, border: '2px solid var(--border2)', borderRadius: 4, background: 'var(--bg)', cursor: 'pointer' }}>Cancel</button>
                        <button onClick={saveName} disabled={saving} style={{ flex: 1, padding: '6px', fontSize: 12, fontWeight: 700, border: '2px solid var(--ink)', borderRadius: 4, background: 'var(--ink)', color: '#fff', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                          {saving ? 'Saving…' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => { setNewName(user ?? ''); setEditingName(true); }}
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: 13, fontWeight: 600, color: 'var(--text)', background: 'none', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                      >
                        Change display name
                      </button>
                      <div style={{ height: 1, background: 'var(--border)' }} />
                      <button
                        onClick={() => { setDropdownOpen(false); onSignOut(); }}
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: 13, fontWeight: 600, color: 'var(--red)', background: 'none', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                      >
                        Sign out
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
          <button
            onClick={onSubmit}
            style={{
              marginLeft: 8, padding: '8px 18px', background: 'var(--ink)', color: 'var(--accent)',
              borderRadius: 4, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5,
              border: '2px solid var(--ink)',
              boxShadow: '2px 2px 0px var(--accent-dark)',
              transition: 'transform 0.1s ease, box-shadow 0.1s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '3px 3px 0px var(--accent-dark)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '2px 2px 0px var(--accent-dark)'; }}
            onMouseDown={e => { e.currentTarget.style.transform = 'translate(1px,1px)'; e.currentTarget.style.boxShadow = '1px 1px 0px var(--accent-dark)'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '3px 3px 0px var(--accent-dark)'; }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Start selling
          </button>
        </div>
      </div>
    </nav>
  );
}
