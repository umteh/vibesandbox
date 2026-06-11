'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Listing, CATEGORIES, fromDbRow } from '@/lib/data';
import Nav from './Nav';
import ListingCard from './ListingCard';
import SubmitModal from './SubmitModal';
import AuthModal from './AuthModal';
import EmailCapture from './EmailCapture';
import ValuationBand from './ValuationBand';

type SortKey = 'score' | 'price';

interface Props {
  initialListings: Listing[];
}

export default function FeedClient({ initialListings }: Props) {
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState<SortKey>('score');
  const [search, setSearch] = useState('');
  const [showBreakdown, setShowBreakdown] = useState(true);


  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitInitialUrl, setSubmitInitialUrl] = useState('');
  const [auth, setAuth] = useState<'signin' | 'signup' | null>(null);
  const [user, setUser] = useState<string | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<{ id: string; email?: string } | null>(null);

  const sbRef = useRef<ReturnType<typeof createBrowserClient> | null>(null);

  function getSb() {
    if (!sbRef.current) {
      sbRef.current = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    }
    return sbRef.current;
  }

  // Wire up Supabase auth + Realtime if env vars are present
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;

    const sb = getSb();

    // Auth state
    sb.auth.getUser().then(async ({ data }: { data: { user: { id: string; email?: string } | null } }) => {
      if (data.user) {
        setSupabaseUser(data.user);
        const fallback = data.user.email?.split('@')[0] ?? 'user';
        setUser(fallback);
        // Fetch display name from profiles
        const { data: profile } = await sb.from('profiles').select('display_name').eq('id', data.user.id).single();
        if (profile?.display_name) setUser(profile.display_name);
      }
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange(
      (_event: string, session: { user: { id: string; email?: string } } | null) => {
        if (session?.user) {
          setSupabaseUser(session.user);
          const fallback = session.user.email?.split('@')[0] ?? 'user';
          setUser(fallback);
          sb.from('profiles').select('display_name').eq('id', session.user.id).single()
            .then(({ data: p }: { data: { display_name: string } | null }) => { if (p?.display_name) setUser(p.display_name); });
        } else {
          setSupabaseUser(null);
          setUser(null);
        }
      }
    );

    // Realtime: unique channel name per mount avoids StrictMode collision
    const channelId = `listings-feed-${Date.now()}`;
    const channel = sb
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'listings' },
        (payload: { new: Record<string, unknown> }) => {
          const updated = fromDbRow(payload.new);
          setListings(prev => prev.map(l => l.id === updated.id ? { ...l, ...updated } : l));
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'listings' },
        (payload: { new: Record<string, unknown> }) => {
          const inserted = fromDbRow(payload.new);
          setListings(prev => [inserted, ...prev.filter(l => l.id !== inserted.id)]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      sb.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmitListing = useCallback((partial: Partial<Listing>) => {
    const newListing: Listing = {
      id: partial.id ?? String(Date.now()),
      title: partial.title ?? '',
      url: partial.url ?? '',
      tagline: partial.tagline ?? '',
      category: partial.category ?? 'Other',
      price: partial.price ?? null,
      priceType: partial.priceType ?? 'fixed',
      creator: partial.creator ?? user ?? 'You',
      avatar: partial.avatar ?? (user ?? 'YO').slice(0, 2).toUpperCase(),
      status: 'pending',
      score: null,
      breakdown: null,
      critique: null,
      tags: partial.tags ?? [],
      createdAt: 'just now',
      screenshotUrl: partial.screenshotUrl,
    };
    // Realtime INSERT may have already added this listing — skip if so
    setListings(prev => prev.some(l => l.id === newListing.id) ? prev : [newListing, ...prev]);
  }, [user]);

  const handleSignOut = useCallback(async () => {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      await getSb().auth.signOut();
    }
    setUser(null);
    setSupabaseUser(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const notForSale = listings.filter(l => {
    if (l.status !== 'not_for_sale') return false;
    if (category !== 'All' && l.category !== category) return false;
    if (search && !`${l.title} ${l.tagline} ${l.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  let filtered = listings.filter(l => {
    if (l.status === 'not_for_sale') return false;
    if (category !== 'All' && l.category !== category) return false;
    if (search && !`${l.title} ${l.tagline} ${l.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (sort === 'score') filtered = [...filtered].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  if (sort === 'price') filtered = [...filtered].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));

  const scored = listings.filter(l => l.status === 'scored').length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Nav
        user={user}
        search={search}
        onSearchChange={setSearch}
        onSignIn={() => setAuth('signin')}
        onSignUp={() => setAuth('signup')}
        onSignOut={handleSignOut}
        onSubmit={() => user ? setSubmitOpen(true) : setAuth('signup')}
        onUserChange={name => setUser(name)}
      />

      {/* Hero */}
      <div style={{
        background: 'var(--bg)',
        padding: '52px 24px 44px',
        textAlign: 'center',
        backgroundImage: 'radial-gradient(circle, oklch(0.55 0.008 260 / 0.06) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/img/robot coding.png"
            alt="AI robot coding"
            style={{ height: 140, width: 'auto', display: 'block', margin: '0 auto 16px' }}
          />
          {/* TODO: re-enable once more listings are scored
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px',
            borderRadius: 4, background: 'var(--accent)', border: '2px solid var(--ink)',
            boxShadow: '2px 2px 0px var(--ink)', marginBottom: 20,
            animation: 'fadeUp 0.45s ease 0.1s both',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ink)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>{scored} apps scored by AI</span>
          </div>
          */}
          <h1 style={{
            fontSize: 'clamp(40px, 6vw, 64px)', fontWeight: 900, letterSpacing: '-0.04em',
            lineHeight: 1.05, marginBottom: 16, textWrap: 'balance',
            animation: 'fadeUp 0.5s ease 0.2s both',
          } as React.CSSProperties}>
            Where builders<br />find buyers
          </h1>
          <p style={{
            fontSize: 14, color: 'var(--text2)', lineHeight: 1.7,
            maxWidth: 480, margin: '0 auto 28px',
            animation: 'fadeUp 0.45s ease 0.35s both',
          }}>
            Turn your hackathon project into{' '}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/cash.png" alt="cash" style={{ height: '3.3em', width: 'auto', display: 'inline-block', verticalAlign: 'middle', margin: '-10px -4px 0' }} />
            {' '}in a few clicks
          </p>
        </div>
      </div>

      <ValuationBand onListThisApp={url => {
        setSubmitInitialUrl(url);
        if (user) {
          setSubmitOpen(true);
        } else {
          setAuth('signup');
        }
      }} />

      {/* Filters */}
      <div style={{ borderBottom: '2px solid var(--border2)', background: 'var(--bg)', position: 'sticky', top: 56, zIndex: 40 }}>
        {/* Fade-out gradient on right edge signals horizontal scroll */}
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: 48, zIndex: 1, pointerEvents: 'none',
            background: 'linear-gradient(to right, transparent, var(--bg))',
          }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 6, height: 52, overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)} style={{
              padding: '6px 14px', borderRadius: 4, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
              minHeight: 32,
              border: `2px solid ${category === c ? 'var(--ink)' : 'var(--border2)'}`,
              background: category === c ? 'var(--ink)' : 'transparent',
              color: category === c ? 'var(--accent)' : 'var(--text2)',
              boxShadow: category === c ? '2px 2px 0px var(--ink)' : 'none',
              transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
            }}>{c}</button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)' }}>Sort:</span>
            {([['score', 'AI Score'], ['price', 'Price']] as const).map(([v, l]) => (
              <button key={v} onClick={() => setSort(v)} style={{
                padding: '5px 12px', borderRadius: 4, fontSize: 11, fontWeight: 700, minHeight: 30,
                background: sort === v ? 'var(--accent)' : 'transparent',
                color: sort === v ? 'var(--ink)' : 'var(--text3)',
                border: `2px solid ${sort === v ? 'var(--ink)' : 'transparent'}`,
              }}>{l}</button>
            ))}
          </div>
        </div>
        </div>
      </div>

      {/* Not-for-sale strip */}
      {notForSale.length > 0 && (
        <div style={{ borderBottom: '2px solid var(--border2)', background: 'var(--bg)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                On the radar
              </span>
              <span style={{ fontSize: 11, padding: '2px 8px', border: '1.5px solid var(--border2)', borderRadius: 4, color: 'var(--text3)', background: 'var(--bg)' }}>
                {notForSale.length}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 } as React.CSSProperties}>
              {notForSale.map((l, i) => (
                <div key={l.id} style={{ minWidth: 260, maxWidth: 300, flex: '0 0 auto' }}>
                  <ListingCard listing={l} showBreakdown={showBreakdown} index={i} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Feed */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 64px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>{filtered.length}</span>
            {' '}listings{category !== 'All' && ` in ${category}`}{search && ` matching "${search}"`}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {search && <button onClick={() => setSearch('')} style={{ fontSize: 12, color: 'var(--blue)' }}>Clear search</button>}
            <button onClick={() => setShowBreakdown(v => !v)} style={{
              fontSize: 11, padding: '4px 10px', borderRadius: 6,
              border: `1px solid ${showBreakdown ? 'var(--blue)' : 'var(--border)'}`,
              background: showBreakdown ? 'var(--blue-light)' : 'var(--bg)',
              color: showBreakdown ? 'var(--blue)' : 'var(--text3)', fontWeight: 500,
            }}>{showBreakdown ? 'Breakdown: on' : 'Breakdown: off'}</button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text3)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 6 }}>No listings found</div>
            <div style={{ fontSize: 14 }}>Try a different category or search term</div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 20,
          }}>
            {filtered.map((l, i) => (
              <ListingCard key={l.id} listing={l} showBreakdown={showBreakdown} index={i} />
            ))}
          </div>
        )}
      </div>

      <EmailCapture />

      <footer style={{ borderTop: '2px solid var(--ink)', background: 'var(--ink)', padding: '32px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.02em' }}>VibeSandbox</span>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[['How it works', '/how-it-works'], ['Deal guide', '/deal-guide'], ['Feedback', '/feedback'], ['Privacy', '/privacy'], ['Terms', '/tos']].map(([label, href]) => (
              <a key={href} href={href} style={{ fontSize: 13, color: 'oklch(0.75 0.01 80)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'oklch(0.75 0.01 80)')}>
                {label}
              </a>
            ))}
          </div>
        </div>
      </footer>

      {submitOpen && (
        <SubmitModal
          onClose={() => { setSubmitOpen(false); setSubmitInitialUrl(''); }}
          onSubmitListing={handleSubmitListing}
          user={user}
          supabaseUserId={supabaseUser?.id ?? null}
          initialUrl={submitInitialUrl || undefined}
        />
      )}
      {auth && (
        <AuthModal
          mode={auth}
          onClose={() => setAuth(null)}
          onToggle={() => setAuth(a => a === 'signin' ? 'signup' : 'signin')}
          onAuth={email => {
            // onAuthStateChange handles state update; just close the modal
            setUser(email.includes('@') ? email.split('@')[0] : email);
            setAuth(null);
          }}
        />
      )}
    </div>
  );
}
