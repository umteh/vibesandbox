import { notFound } from 'next/navigation';
import Link from 'next/link';
import { LISTINGS, fromDbRow, Listing, DIMENSION_LABELS, DIMENSION_WEIGHTS, DIMENSIONS_ORDERED, priceDisplay, scoreColor } from '@/lib/data';
import ScoreBadge from '@/components/ScoreBadge';
import DimBar from '@/components/DimBar';
import Avatar from '@/components/Avatar';
import Tag from '@/components/Tag';
import AppScreenPlaceholder from '@/components/AppScreenPlaceholder';
import ListingContactForm from '@/components/ListingContactForm';
import HighlightedCritique from '@/components/HighlightedCritique';
import ListingOwnerActions from '@/components/ListingOwnerActions';
import ListingMetadataDisplay from '@/components/ListingMetadataDisplay';
import type { ListingMetadata } from '@/lib/metadata';

export const revalidate = 30;

async function getListing(id: string): Promise<Listing | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return LISTINGS.find(l => l.id === id) ?? null;
  }
  try {
    const { createServerSupabaseClient } = await import('@/lib/supabase/server');
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return LISTINGS.find(l => l.id === id) ?? null;
    return fromDbRow(data);
  } catch {
    return LISTINGS.find(l => l.id === id) ?? null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const listing = await getListing(params.id);
  if (!listing) return { title: 'Not found — VibeSandbox' };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vibesandbox.store';
  const url = `${siteUrl}/listings/${params.id}`;
  const title = `${listing.title} — VibeSandbox`;
  const description = listing.tagline || `${listing.title} is listed for sale on VibeSandbox.`;
  const image = listing.screenshotUrl ?? `${siteUrl}/img/og-default.png`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'VibeSandbox',
      images: [{ url: image, width: 1200, height: 630, alt: listing.title }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function ListingPage({ params }: { params: { id: string } }) {
  const listing = await getListing(params.id);
  if (!listing) notFound();

  // Check if current user owns this listing
  let isOwner = false;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && listing.userId) {
    try {
      const { createServerSupabaseClient } = await import('@/lib/supabase/server');
      const supabase = createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      isOwner = user?.id === listing.userId;
    } catch { /* not logged in */ }
  }

  const price = priceDisplay(listing);
  const c = listing.score !== null ? scoreColor(listing.score) : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav style={{ borderBottom: '1px solid var(--border)', background: 'oklch(0.985 0.004 80 / 0.92)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/feed" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo-new.png" alt="VibeSandbox" style={{ height: 40, width: 'auto', display: 'block' }} />
          </Link>
          <span style={{ fontSize: 13, color: 'var(--text3)' }}>·</span>
          <Link href="/feed" style={{ fontSize: 13, color: 'var(--text3)', textDecoration: 'none' }}>← Back to feed</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          <AppScreenPlaceholder title={listing.title} category={listing.category} size="lg" screenshotUrl={listing.screenshotUrl} />

          <div style={{ padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>{listing.title}</h1>
                  <ScoreBadge score={listing.score} size="lg" />
                </div>
                <a href={`https://${listing.url}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 13, color: 'var(--blue)', textDecoration: 'none', fontFamily: "'DM Mono', monospace" }}>
                  {listing.url} ↗
                </a>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
              <span style={{ padding: '4px 10px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>
                {listing.category}
              </span>
              {listing.tags.map(t => <Tag key={t}>{t}</Tag>)}
              <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text3)' }}>Listed {listing.createdAt}</span>
            </div>

            <p style={{ fontSize: 16, color: 'var(--text)', lineHeight: 1.7, marginBottom: 28 }}>{listing.tagline}</p>

            {listing.status === 'not_for_sale' ? (
              <>
                {/* Buyer critique — positive AI analysis */}
                {listing.critique && (
                  <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 28 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                      What buyers love about this app
                    </div>
                    <p style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.7, margin: 0 }}>{listing.critique}</p>
                  </div>
                )}

                {/* Locked score breakdown */}
                <div style={{ background: 'var(--bg)', border: '2px solid var(--border2)', borderRadius: 12, padding: 24, marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)' }}>AI Acquisition Score</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      🔒 Unlocked when claimed
                    </div>
                  </div>
                  {DIMENSIONS_ORDERED.map(k => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <span style={{ fontSize: 12, color: 'var(--text3)', width: 56, flexShrink: 0 }}>{DIMENSION_LABELS[k]}</span>
                      <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: '60%', height: '100%', background: 'var(--border2)', borderRadius: 4 }} />
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--border2)', width: 28, textAlign: 'right', fontFamily: "'DM Mono', monospace" }}>?</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 16, padding: '12px 16px', background: '#fff', border: '1px solid var(--border)', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>Full score breakdown unlocked when you claim this listing</div>
                  </div>
                </div>

                {/* Claim CTA */}
                <div style={{ background: 'oklch(0.97 0.04 128)', border: '2px solid var(--ink)', borderRadius: 8, padding: 24, marginBottom: 28 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.01em' }}>
                    Is this your app?
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 16 }}>
                    Claim it to unlock the full AI score breakdown, see buyer interest, and decide if you want to list it for sale.
                  </p>
                  <a
                    href={`mailto:support@vibesandbox.store?subject=Claim listing: ${encodeURIComponent(listing.title)}&body=Hi, I'd like to claim the VibeSandbox listing for ${encodeURIComponent(listing.title)}.`}
                    style={{
                      display: 'inline-block', padding: '10px 24px',
                      background: 'var(--ink)', color: 'var(--accent)',
                      border: '2px solid var(--ink)', borderRadius: 4,
                      fontWeight: 700, fontSize: 14, textDecoration: 'none',
                      boxShadow: '3px 3px 0px oklch(0.3 0.04 128)',
                    }}
                  >
                    Claim this listing →
                  </a>
                </div>
              </>
            ) : listing.score !== null && c ? (
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                  <div style={{ fontSize: 48, fontWeight: 800, color: c.text, fontFamily: "'DM Mono', monospace", letterSpacing: '-0.04em', lineHeight: 1 }}>
                    {listing.score}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: c.text }}>{c.label}</div>
                    <div style={{ fontSize: 13, color: 'var(--text3)' }}>AI quality score · v{listing.screenshotStatus}</div>
                  </div>
                </div>
                {listing.breakdown && (
                  <div style={{ marginBottom: 20 }}>
                    {DIMENSIONS_ORDERED.map(k => (
                      <DimBar
                        key={k}
                        label={DIMENSION_LABELS[k]}
                        value={(listing.breakdown as unknown as Record<string, number>)[k] ?? 0}
                        weight={DIMENSION_WEIGHTS[k]}
                      />
                    ))}
                  </div>
                )}
                {listing.critique && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                      AI Critique
                    </div>
                    <HighlightedCritique text={listing.critique} />
                  </div>
                )}
              </div>
            ) : listing.status === 'scoring_failed' ? (
              <div style={{ background: 'var(--red-light)', border: '1px solid var(--red)', borderRadius: 12, padding: 20, marginBottom: 28 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Scoring failed</div>
                <div style={{ fontSize: 14, color: 'var(--text2)' }}>
                  Our AI encountered an error evaluating this app. The seller can request a re-score.
                </div>
              </div>
            ) : (
              <div style={{ background: 'var(--amber-light)', border: '1px solid var(--amber)', borderRadius: 12, padding: 20, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="animate-pulse-dot" style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--amber)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Score in progress</div>
                  <div style={{ fontSize: 14, color: 'var(--text2)' }}>
                    Our AI is evaluating this app across 5 dimensions. Usually &lt;5 minutes. Listing is visible while scoring runs.
                  </div>
                </div>
              </div>
            )}

            {listing.screenshotStatus === 'auth_required' && (
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 12, padding: 18, marginBottom: 28 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Manual screenshot needed</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>
                  This app requires login. Upload a screenshot so AI can evaluate it.
                </div>
                <button style={{ padding: '8px 16px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: 7, fontSize: 13, fontWeight: 500, color: 'var(--text2)', cursor: 'pointer' }}>
                  Upload screenshot →
                </button>
              </div>
            )}

            {listing.listing_metadata && Object.keys(listing.listing_metadata).length > 0 && (
              <ListingMetadataDisplay metadata={listing.listing_metadata as ListingMetadata} />
            )}

            {listing.status !== 'not_for_sale' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20, borderTop: '1px solid var(--border)', marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar initials={listing.avatar} size={40} />
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{listing.creator}</div>
                      <div style={{ fontSize: 13, color: 'var(--text3)' }}>{isOwner ? 'Your listing' : 'Seller'}</div>
                    </div>
                  </div>
                  {!isOwner && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: listing.priceType === 'free' ? 'var(--green)' : 'var(--text)' }}>
                        {price.label}
                      </div>
                      {price.sub && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{price.sub}</div>}
                    </div>
                  )}
                </div>

                {isOwner
                  ? <ListingOwnerActions listing={listing} />
                  : <ListingContactForm listing={listing} />
                }
              </>
            )}
          </div>
        </div>
      </div>

      <footer style={{ borderTop: '1px solid var(--border)', background: '#fff', padding: 24, textAlign: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>VibeSandbox · </span>
        <Link href="/how-it-works" style={{ fontSize: 12, color: 'var(--text3)' }}>How it works</Link>
      </footer>
    </div>
  );
}
