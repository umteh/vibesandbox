import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { metadata } = await req.json();
  const admin = createAdminClient();

  // Verify user owns this listing
  const { data: listing } = await admin
    .from('listings')
    .select('user_id')
    .eq('id', params.id)
    .single();

  if (!listing || listing.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { error } = await admin
    .from('listings')
    .update({ listing_metadata: metadata })
    .eq('id', params.id);

  if (error) {
    console.error('[metadata] update failed:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
