import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { encryptEmail } from '@/lib/crypto';

export async function PATCH(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { display_name } = await req.json();
  if (!display_name?.trim()) return NextResponse.json({ error: 'Display name is required' }, { status: 422 });

  const admin = createAdminClient();

  // Fetch existing profile to preserve email_encrypted
  const { data: existing } = await admin
    .from('profiles')
    .select('email_encrypted')
    .eq('id', user.id)
    .single();

  const emailEnc = existing?.email_encrypted
    ?? (user.email ? encryptEmail(user.email) : '');

  const { error } = await admin
    .from('profiles')
    .upsert({
      id: user.id,
      display_name: display_name.trim(),
      email_encrypted: emailEnc,
    }, { onConflict: 'id' });

  if (error) {
    console.error('[profile] upsert failed:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  // Also update listings so creator_name reflects the new display name
  await admin
    .from('listings')
    .update({ creator_name: display_name.trim() })
    .eq('user_id', user.id);

  return NextResponse.json({ ok: true, display_name: display_name.trim() });
}
