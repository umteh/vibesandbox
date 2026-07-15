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
import ClaimButton from '@/components/ClaimButton';
import ListingMetadataDisplay from '@/components/ListingMetadataDisplay';
import PlatformIcon from '@/components/PlatformIcon';
import type { ListingMetadata, AppStoreData } from '@/lib/metadata';
import { inferBusinessModel } from '@/lib/metadata';

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
          <div style={{ position: 'relative' }}>
            <AppScreenPlaceholder
              title={listing.title}
              category={listing.category}
              size="lg"
              screenshotUrl={listing.screenshotUrl}
              screenshots={(listing.listing_metadata as { screenshots?: string[] } | null)?.screenshots}
              platform={listing.platform}
            />
            <div style={{
              position: 'absolute', top: 10, right: 10,
              width: 30, height: 30,
              background: 'rgba(255,255,255,0.92)',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text2)',
            }}>
              <PlatformIcon platform={listing.platform} />
            </div>
          </div>

          <div style={{ padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>{listing.title}</h1>
                  {listing.status !== 'not_for_sale' && <ScoreBadge score={listing.score} size="lg" />}
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
                {/* Valuation estimate */}
                {(() => {
                  const val = (listing.listing_metadata as { valuation?: { low: string; high: string; label: string; reasons: string[] } } | null)?.valuation;
                  if (!val?.low) return null;
                  const labelColor = val.label === 'Strong buy' ? 'var(--green)' : val.label === 'Speculative' ? 'var(--amber)' : 'var(--blue)';
                  const labelBg    = val.label === 'Strong buy' ? 'oklch(0.95 0.06 145)' : val.label === 'Speculative' ? 'oklch(0.97 0.05 80)' : 'oklch(0.95 0.04 240)';
                  return (
                    <div style={{ border: '2px solid var(--ink)', borderRadius: 12, padding: 28, marginBottom: 28, background: '#fff' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                        Estimated acquisition value
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
                        <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text)', fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>
                          {val.low} – {val.high}
                        </div>
                        <span style={{
                          fontSize: 12, fontWeight: 700, padding: '4px 10px',
                          border: `2px solid ${labelColor}`, borderRadius: 4,
                          color: labelColor, background: labelBg,
                        }}>
                          {val.label}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {val.reasons.map((r, i) => (
                          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <span style={{ color: 'var(--text3)', flexShrink: 0, marginTop: 2, fontSize: 14 }}>→</span>
                            <span style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.55 }}>{r}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text3)' }}>
                        Full score breakdown + detailed analysis unlocked when you claim this listing.
                      </div>
                    </div>
                  );
                })()}

                {/* Buyer critique fallback when no valuation */}
                {!((listing.listing_metadata as { valuation?: unknown } | null)?.valuation) && listing.critique && (
                  <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 28 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                      What buyers love about this app
                    </div>
                    <p style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.7, margin: 0 }}>{listing.critique}</p>
                  </div>
                )}

                {/* Claim CTA */}
                <ClaimButton listingId={params.id} listingTitle={listing.title} />
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

            {(() => {
              const appStore = (listing.listing_metadata as ListingMetadata | null)?.app_store;
              if (!appStore) return null;
              const model = inferBusinessModel(appStore);
              const modelStyle: Record<string, { color: string; bg: string }> = {
                'Paid':         { color: 'var(--blue)',  bg: 'var(--blue-light)' },
                'Freemium':     { color: 'var(--green)', bg: 'oklch(0.95 0.06 145)' },
                'Ad-supported': { color: 'var(--amber)', bg: 'var(--amber-light)' },
                'Ads + IAP':    { color: 'var(--amber)', bg: 'var(--amber-light)' },
                'Free':         { color: 'var(--text3)', bg: 'var(--bg2)' },
              };
              const ms = modelStyle[model] ?? modelStyle['Free'];
              const signals: { label: string; value: string }[] = [];
              if (appStore.price)      signals.push({ label: 'Price', value: appStore.price });
              if (appStore.inAppPurchases !== undefined) signals.push({ label: 'IAP', value: appStore.inAppPurchases ? 'Yes' : 'No' });
              if (appStore.adSupported  !== undefined) signals.push({ label: 'Ads', value: appStore.adSupported  ? 'Yes' : 'No' });
              if (appStore.installs)   signals.push({ label: 'Installs', value: appStore.installs });
              if (appStore.rating)     signals.push({ label: 'Rating', value: `${appStore.rating.toFixed(1)} ★${appStore.ratingCount ? ` (${appStore.ratingCount.toLocaleString()})` : ''}` });
              return (
                <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
                    Business Model
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 13, fontWeight: 700, padding: '4px 10px',
                      border: `1.5px solid ${ms.color}`, borderRadius: 4,
                      color: ms.color, background: ms.bg, flexShrink: 0,
                    }}>
                      {model}
                    </span>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {signals.map(s => (
                        <span key={s.label} style={{ fontSize: 12, color: 'var(--text2)', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 4, padding: '3px 8px' }}>
                          <span style={{ color: 'var(--text3)' }}>{s.label}:</span> {s.value}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

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
