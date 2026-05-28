import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  // Vercel cron jobs send this header automatically
  const isVercelCron = req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`;
  const isInternal = req.headers.get('x-internal-secret') === process.env.INTERNAL_SECRET;

  if (!isVercelCron && !isInternal) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: pending, error } = await admin
    .from('listings')
    .select('id, url, description, platform')
    .eq('status', 'pending')
    .limit(5);

  if (error) {
    console.error('[cron] failed to fetch pending listings:', error);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  if (!pending || pending.length === 0) {
    console.log('[cron] no pending listings');
    return NextResponse.json({ ok: true, scored: 0 });
  }

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  console.log(`[cron] scoring ${pending.length} pending listings`);

  const results = await Promise.allSettled(
    pending.map(listing =>
      fetch(`${baseUrl}/api/score-listing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': process.env.INTERNAL_SECRET!,
        },
        body: JSON.stringify({
          listing_id: listing.id,
          url: listing.url,
          description: listing.description,
          platform: listing.platform,
        }),
      }).then(res => {
        console.log(`[cron] scored ${listing.id} → ${res.status}`);
        return res;
      })
    )
  );

  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  return NextResponse.json({ ok: true, scored: succeeded, failed });
}
