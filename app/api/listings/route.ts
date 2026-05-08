import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';

const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_DAYS = 7;

export async function POST(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: 'Supabase not configured (set NEXT_PUBLIC_SUPABASE_URL)' }, { status: 503 });
  }

  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { title, url, description, category, priceType, price, tags, screenshotUrl, metadata, platform } = body as {
    title?: string;
    url?: string;
    description?: string;
    category?: string;
    priceType?: string;
    price?: number;
    tags?: string[];
    screenshotUrl?: string | null;
    metadata?: Record<string, unknown>;
    platform?: string;
  };

  if (!title?.trim()) return NextResponse.json({ error: 'title is required' }, { status: 422 });
  if (!url?.trim())   return NextResponse.json({ error: 'url is required' }, { status: 422 });
  if (!description?.trim()) return NextResponse.json({ error: 'description is required' }, { status: 422 });
  if (!category?.trim())    return NextResponse.json({ error: 'category is required' }, { status: 422 });
  if (!['fixed', 'offer', 'free'].includes(priceType ?? '')) {
    return NextResponse.json({ error: 'priceType must be fixed, offer, or free' }, { status: 422 });
  }

  const admin = createAdminClient();

  // Rate limit — skip for admin accounts
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin = user.email && adminEmails.includes(user.email.toLowerCase());

  if (!isAdmin) {
    const windowStart = new Date(Date.now() - RATE_LIMIT_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await admin
      .from('submission_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', windowStart);

    if (countError) {
      console.error('[listings] rate limit query failed:', countError);
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }

    if ((count ?? 0) >= RATE_LIMIT_MAX) {
      return NextResponse.json(
        { error: `You've reached your submission limit this week (${RATE_LIMIT_MAX} listings per ${RATE_LIMIT_DAYS} days).` },
        { status: 429 }
      );
    }
  }

  // Build creator display name / initials from user metadata or email
  const displayName =
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    user.email?.split('@')[0] ||
    'Anonymous';
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((p: string) => p[0]?.toUpperCase() ?? '')
    .join('');

  // Insert listing
  const { data: listing, error: insertError } = await admin
    .from('listings')
    .insert({
      user_id: user.id,
      creator_name: displayName,
      creator_initials: initials || displayName.slice(0, 2).toUpperCase(),
      title: title.trim(),
      url: url.trim().replace(/^https?:\/\//, ''),
      description: description.trim(),
      category: category.trim(),
      price_cents: priceType === 'fixed' && price ? Math.round(price * 100) : null,
      price_type: priceType,
      status: 'pending',
      screenshot_url: screenshotUrl ?? null,
      screenshot_status: screenshotUrl ? 'captured' : 'pending',
      tags: Array.isArray(tags) ? tags : [],
      listing_metadata: metadata ?? {},
      platform: ['web', 'ios', 'android', 'cross-platform'].includes(platform ?? '') ? platform : 'web',
    })
    .select()
    .single();

  if (insertError || !listing) {
    console.error('[listings] insert failed:', insertError);
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 });
  }

  // Record in submission log
  await admin.from('submission_log').insert({ user_id: user.id, listing_id: listing.id });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  // Fire-and-forget: score the listing (captures screenshot + calls GPT-4o)
  if (process.env.INTERNAL_SECRET) {
    fetch(`${baseUrl}/api/score-listing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.INTERNAL_SECRET },
      body: JSON.stringify({ listing_id: listing.id, url: listing.url, description: listing.description, platform: listing.platform }),
    }).catch(err => console.error('[listings] score-listing fire-and-forget failed:', err));
  }

  return NextResponse.json(listing, { status: 201 });
}
