'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Listing, DIMENSION_LABELS, DIMENSIONS_ORDERED, priceDisplay } from '@/lib/data';
import ScoreBadge from './ScoreBadge';
import Avatar from './Avatar';
import AppScreenPlaceholder from './AppScreenPlaceholder';

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
      <AppScreenPlaceholder
        title={listing.title}
        category={listing.category}
        screenshotUrl={listing.screenshotUrl}
        platform={listing.platform}
      />
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>{listing.title}</div>
              {listing.platform && listing.platform !== 'web' && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3, border: '1.5px solid var(--border2)', color: 'var(--text3)', background: 'var(--bg)' }}>
                  {listing.platform === 'ios' ? 'iOS' : listing.platform === 'android' ? 'Android' : 'Mobile'}
                </span>
              )}
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
