'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Listing, DIMENSION_LABELS, priceDisplay } from '@/lib/data';
import ScoreBadge from './ScoreBadge';
import Avatar from './Avatar';
import AppScreenPlaceholder from './AppScreenPlaceholder';

interface Props {
  listing: Listing;
  showBreakdown?: boolean;
}

export default function ListingCard({ listing, showBreakdown = true }: Props) {
  const [hovered, setHovered] = useState(false);
  const router = useRouter();
  const price = priceDisplay(listing);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => router.push(`/listings/${listing.id}`)}
      style={{
        background: '#fff',
        borderRadius: 'var(--radius)',
        border: `2px solid var(--ink)`,
        boxShadow: hovered ? '4px 4px 0px var(--ink)' : '2px 2px 0px var(--ink)',
        overflow: 'hidden',
        cursor: 'pointer',
        transform: hovered ? 'translate(-1px, -1px)' : 'none',
        transition: 'all 0.12s ease',
      }}
    >
      <AppScreenPlaceholder
        title={listing.title}
        category={listing.category}
        screenshotUrl={listing.screenshotUrl}
        platform={listing.platform}
      />
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{listing.title}</div>
              {listing.platform && listing.platform !== 'web' && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3, border: '1.5px solid var(--border2)', color: 'var(--text3)', background: 'var(--bg)' }}>
                  {listing.platform === 'ios' ? 'iOS' : listing.platform === 'android' ? 'Android' : 'Mobile'}
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono', monospace" }}>{listing.url}</div>
          </div>
          <ScoreBadge score={listing.score} />
        </div>

        <p style={{
          fontSize: 13, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 12,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {listing.tagline}
        </p>

        {showBreakdown && listing.breakdown && (
          <div style={{ marginBottom: 12, display: 'flex', gap: 6 }}>
            {(Object.entries(listing.breakdown) as [keyof typeof DIMENSION_LABELS, number][]).map(([k, v]) => {
              const pct = (v / 10) * 100;
              const c = v >= 8 ? 'var(--green)' : v >= 6 ? 'var(--blue)' : v >= 4 ? 'var(--amber)' : 'var(--red)';
              return (
                <div key={k} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }} title={`${DIMENSION_LABELS[k]}: ${v}/10`}>
                  <div style={{ width: '100%', height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: c, borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {DIMENSION_LABELS[k]}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Avatar initials={listing.avatar} size={22} />
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>{listing.creator}</span>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>· {listing.createdAt}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: listing.priceType === 'free' ? 'var(--green)' : 'var(--text)' }}>
              {price.label}
            </div>
            {price.sub && <div style={{ fontSize: 10, color: 'var(--text3)' }}>{price.sub}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
