import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

const TIMEOUT_MS = 20_000;

export async function POST(req: NextRequest) {
  // Protect from external calls
  const secret = req.headers.get('x-internal-secret');
  if (!process.env.INTERNAL_SECRET || secret !== process.env.INTERNAL_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { listing_id, url } = await req.json() as { listing_id: string; url: string };
  if (!listing_id || !url) {
    return NextResponse.json({ error: 'listing_id and url required' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Normalise URL
  const fullUrl = url.startsWith('http') ? url : `https://${url}`;

  // microlink.io: free screenshot service, no API key needed (50 req/day on free tier)
  const captureUrl = `https://api.microlink.io/?url=${encodeURIComponent(fullUrl)}&screenshot=true&meta=false&embed=screenshot.url`;

  try {
    const res = await fetch(captureUrl, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'User-Agent': 'VibeSandbox/1.0' },
    });

    if (!res.ok) throw new Error(`microlink responded ${res.status}`);

    const contentType = res.headers.get('content-type') ?? 'image/jpeg';
    const buffer = await res.arrayBuffer();

    // Store in Supabase Storage
    const path = `auto/${listing_id}.jpg`;
    const { data: uploaded, error: uploadError } = await admin.storage
      .from('screenshots')
      .upload(path, buffer, { contentType, upsert: true });

    if (uploadError || !uploaded) throw uploadError ?? new Error('upload returned no data');

    const { data: { publicUrl } } = admin.storage.from('screenshots').getPublicUrl(uploaded.path);

    await admin.from('listings').update({
      screenshot_url: publicUrl,
      screenshot_status: 'captured',
    }).eq('id', listing_id);

    console.log(`[capture] ✓ ${listing_id} → ${publicUrl}`);
    return NextResponse.json({ url: publicUrl });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[capture] ✗ ${listing_id}: ${message}`);

    // Mark as failed so the listing shows the manual upload prompt
    await admin.from('listings').update({ screenshot_status: 'failed' }).eq('id', listing_id);
    return NextResponse.json({ error: 'Capture failed' }, { status: 500 });
  }
}
