import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  const { data: listing } = await admin
    .from('listings')
    .select('user_id')
    .eq('id', params.id)
    .single();

  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (listing.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { error } = await admin.from('listings').delete().eq('id', params.id);
  if (error) {
    console.error('[listings] delete failed:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const admin = createAdminClient();

  const { data: listing } = await admin
    .from('listings')
    .select('user_id')
    .eq('id', params.id)
    .single();

  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (listing.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const allowed = ['title', 'url', 'description', 'category', 'price_cents', 'price_type', 'tags'];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  const { data: updated, error } = await admin
    .from('listings')
    .update(update)
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  return NextResponse.json(updated);
}
