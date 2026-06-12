'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Listing, DIMENSION_LABELS, DIMENSIONS_ORDERED, priceDisplay } from '@/lib/data';
import ScoreBadge from './ScoreBadge';
import Avatar from './Avatar';
import AppScreenPlaceholder from './AppScreenPlaceholder';

function PlatformIcon({ platform }: { platform?: string }) {
  if (!platform || platform === 'web') {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    );
  }
  if (platform === 'ios') {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
    );
  }
  if (platform === 'android') {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84 1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 1.23 12.95 1 12 1c-.96 0-1.86.23-2.66.63L7.85.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.97 3.26 6 5.01 6 7h12c0-1.99-.97-3.75-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z"/>
      </svg>
    );
  }
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
      <line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  );
}

interface Props {
  listing: Listing;
  showBreakdown?: boolean;
  index?: number;
}

export default function ListingCard({ listing, showBreakdown = true, index = 0 }: Props) {
  const [hovered, setHovered] = useState(false);
  const router = useRouter();
  const price = priceDisplay(listing);
  const enterDelay = `${Math.min(index * 0.06, 0.48)}s`;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => router.push(`/listings/${listing.id}`)}
      style={{
        background: '#fff',
        borderRadius: 'var(--radius)',
        border: `2px solid var(--ink)`,
        boxShadow: hovered ? '5px 5px 0px var(--ink)' : '2px 2px 0px var(--ink)',
        overflow: 'hidden',
        cursor: 'pointer',
        transform: hovered ? 'translate(-2px, -2px)' : 'none',
        transition: 'transform 0.12s ease, box-shadow 0.12s ease',
        animation: `cardEnter 0.4s ease ${enterDelay} both`,
        height: '100%',
      }}
    >
      <div style={{ position: 'relative' }}>
        <AppScreenPlaceholder
          title={listing.title}
          category={listing.category}
          screenshotUrl={listing.screenshotUrl}
          platform={listing.platform}
        />
        <div style={{
          position: 'absolute', top: 8, right: 8,
          width: 26, height: 26,
          background: 'rgba(255,255,255,0.92)',
          borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text2)',
        }}>
          <PlatformIcon platform={listing.platform} />
        </div>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>{listing.title}</div>
            </div>
          </div>
          {listing.status !== 'not_for_sale' && <ScoreBadge score={listing.score} />}
        </div>

        <p style={{
          fontSize: 13, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 12,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {listing.tagline}
        </p>

        {listing.status === 'not_for_sale' && (() => {
          const val = (listing.listing_metadata as { valuation?: { low: string; high: string; label: string } } | null)?.valuation;
          if (!val?.low) return null;
          const labelColor = val.label === 'Strong buy' ? 'var(--green)' : val.label === 'Speculative' ? 'var(--amber)' : 'var(--blue)';
          return (
            <div style={{ marginBottom: 12, padding: '10px 12px', background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 6 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
                Est. acquisition value
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', fontFamily: "'DM Mono', monospace" }}>
                  {val.low} – {val.high}
                </span>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', border: `1.5px solid ${labelColor}`, borderRadius: 3, color: labelColor, whiteSpace: 'nowrap' }}>
                  {val.label}
                </span>
              </div>
            </div>
          );
        })()}

        {showBreakdown && listing.breakdown && listing.status !== 'not_for_sale' && (
          <div style={{ marginBottom: 12, display: 'flex', gap: 5 }}>
            {DIMENSIONS_ORDERED.map((k, bi) => {
              const v = (listing.breakdown as unknown as Record<string, number>)[k] ?? 0;
              const pct = (v / 10) * 100;
              const c = v >= 8 ? 'var(--green)' : v >= 6 ? 'var(--blue)' : v >= 4 ? 'var(--amber)' : 'var(--red)';
              const barDelay = `${parseFloat(enterDelay) + 0.25 + bi * 0.06}s`;
              return (
                <div key={k} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }} title={`${DIMENSION_LABELS[k]}: ${v}/10`}>
                  <div style={{ width: '100%', height: 5, background: 'var(--border)', overflow: 'hidden', border: '1px solid var(--border2)' }}>
                    <div style={{
                      width: `${pct}%`, height: '100%', background: c,
                      transformOrigin: 'left',
                      animation: `barFill 0.55s cubic-bezier(0.22,1,0.36,1) ${barDelay} both`,
                    }} />
                  </div>
                  <span style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 700, whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
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
            <span style={{ fontSize: 12, color: 'var(--text2)', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listing.creator}</span>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>· {listing.createdAt}</span>
          </div>
          {listing.status === 'not_for_sale' ? (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '3px 8px',
              border: '2px solid var(--border2)', borderRadius: 4,
              color: 'var(--text3)', background: 'var(--bg)',
              whiteSpace: 'nowrap',
            }}>
              Not for sale
            </span>
          ) : (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: listing.priceType === 'free' ? 'var(--green)' : 'var(--text)' }}>
                {price.label}
              </div>
              {price.sub && <div style={{ fontSize: 10, color: 'var(--text3)' }}>{price.sub}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
