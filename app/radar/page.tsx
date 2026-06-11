import Link from 'next/link';
import { fromDbRow, Listing } from '@/lib/data';
import RadarClient from '@/components/RadarClient';

export const metadata = { title: 'On the Radar — VibeSandbox' };
export const revalidate = 30;

async function getRadarListings(): Promise<Listing[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  try {
    const { createServerSupabaseClient } = await import('@/lib/supabase/server');
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'not_for_sale')
      .order('created_at', { ascending: false });
    if (error) { console.error('[radar]', error); return []; }
    return (data ?? []).map(fromDbRow);
  } catch (err) {
    console.error('[radar]', err);
    return [];
  }
}

export default async function RadarPage() {
  const listings = await getRadarListings();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav style={{ borderBottom: '1px solid var(--border)', background: 'oklch(0.985 0.004 80 / 0.92)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/feed" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo-new.png" alt="VibeSandbox" style={{ height: 40, width: 'auto', display: 'block' }} />
          </Link>
          <span style={{ fontSize: 13, color: 'var(--text3)' }}>·</span>
          <Link href="/feed" style={{ fontSize: 13, color: 'var(--text3)', textDecoration: 'none' }}>← Back to feed</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', margin: 0 }}>
              On the radar
            </h1>
            <span style={{
              fontSize: 12, padding: '3px 10px',
              border: '1.5px solid var(--border2)', borderRadius: 4,
              color: 'var(--text3)', background: 'var(--bg)',
              fontWeight: 700,
            }}>
              {listings.length}
            </span>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text3)', marginTop: 8, maxWidth: 480 }}>
            Apps we've spotted that aren't listed for sale yet.
          </p>
        </div>

        {listings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text3)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📡</div>
            <div style={{ fontSize: 16, fontWeight: 500 }}>Nothing on the radar yet</div>
          </div>
        ) : (
          <RadarClient listings={listings} />
        )}
      </div>
    </div>
  );
}
