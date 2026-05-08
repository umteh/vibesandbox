'use client';

import { Listing, DIMENSION_LABELS, DIMENSION_WEIGHTS, priceDisplay, scoreColor } from '@/lib/data';
import ScoreBadge from './ScoreBadge';
import DimBar from './DimBar';
import Avatar from './Avatar';
import Tag from './Tag';
import AppScreenPlaceholder from './AppScreenPlaceholder';

interface Props {
  listing: Listing;
  onClose: () => void;
  onContact: (listing: Listing) => void;
}

export default function DetailModal({ listing, onClose, onContact }: Props) {
  const price = priceDisplay(listing);
  const c = listing.score !== null ? scoreColor(listing.score) : null;

  return (
    <div className="overlay" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        className="animate-slide-up"
        style={{
          background: '#fff', borderRadius: 'var(--radius-lg)',
          width: 680, maxHeight: '90vh', overflow: 'auto',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <AppScreenPlaceholder
          title={listing.title}
          category={listing.category}
          size="lg"
          screenshotUrl={listing.screenshotUrl}
        />
        <div style={{ padding: 28 }}>
          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700 }}>{listing.title}</h2>
                <ScoreBadge score={listing.score} size="lg" />
              </div>
              <a href={`https://${listing.url}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: 'var(--blue)', textDecoration: 'none', fontFamily: "'DM Mono', monospace" }}>
                {listing.url} ↗
              </a>
            </div>
            <button onClick={onClose} style={{ fontSize: 22, color: 'var(--text3)', lineHeight: 1, marginLeft: 16 }}>×</button>
          </div>

          {/* Meta */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
            <span style={{ padding: '4px 10px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>
              {listing.category}
            </span>
            {listing.tags.map(t => <Tag key={t}>{t}</Tag>)}
            <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text3)' }}>Listed {listing.createdAt}</span>
          </div>

          <p style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.65, marginBottom: 24 }}>{listing.tagline}</p>

          {/* Score section */}
          {listing.score !== null && c ? (
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 40, fontWeight: 800, color: c.text, fontFamily: "'DM Mono', monospace", letterSpacing: '-0.03em' }}>
                  {listing.score}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{c.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>AI quality score · v1</div>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                {listing.breakdown && (Object.entries(listing.breakdown) as [keyof typeof DIMENSION_LABELS, number][]).map(([k, v]) => (
                  <DimBar key={k} label={DIMENSION_LABELS[k]} value={v} weight={DIMENSION_WEIGHTS[k]} />
                ))}
              </div>
              {listing.critique && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    AI Critique
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>{listing.critique}</p>
                </div>
              )}
            </div>
          ) : listing.status === 'scoring_failed' ? (
            <div style={{ background: 'var(--red-light)', border: '1px solid var(--red)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Scoring failed</div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                Our AI encountered an error while evaluating this app. Submit a re-score request to try again.
              </div>
            </div>
          ) : (
            <div style={{ background: 'var(--amber-light)', border: '1px solid var(--amber)', borderRadius: 12, padding: 20, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="animate-pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--amber)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>Score in progress</div>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                  Our AI is evaluating this app across 5 dimensions. Usually takes &lt;5 minutes. This listing is visible while scoring runs.
                </div>
              </div>
            </div>
          )}

          {/* Auth-required upload prompt */}
          {listing.screenshotStatus === 'auth_required' && (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 12, padding: 16, marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Manual screenshot needed</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10 }}>
                This app requires login. Upload a screenshot so AI can evaluate it.
              </div>
              <button style={{
                padding: '8px 16px', background: 'var(--bg)', border: '1px solid var(--border2)',
                borderRadius: 7, fontSize: 12, fontWeight: 500, color: 'var(--text2)', cursor: 'pointer',
              }}>
                Upload screenshot →
              </button>
            </div>
          )}

          {/* Creator + CTA */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar initials={listing.avatar} size={36} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{listing.creator}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>Seller</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: listing.priceType === 'free' ? 'var(--green)' : 'var(--text)' }}>
                  {price.label}
                </div>
                {price.sub && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{price.sub}</div>}
              </div>
              <button
                onClick={() => { onClose(); onContact(listing); }}
                style={{
                  padding: '11px 22px', background: 'var(--blue)', color: '#fff', borderRadius: 9,
                  fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap',
                }}
              >
                Contact Seller →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
