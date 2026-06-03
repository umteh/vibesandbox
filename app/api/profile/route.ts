import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { encryptEmail } from '@/lib/crypto';

// Called immediately after email/password signUp() to seed the profile row.
// OAuth sign-ups are handled by /auth/callback instead.
export async function POST(_req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const emailEnc = user.email ? encryptEmail(user.email) : '';
  const displayName = user.email?.split('@')[0] ?? 'user';

  const { error } = await admin
    .from('profiles')
    .upsert({ id: user.id, display_name: displayName, email_encrypted: emailEnc }, { onConflict: 'id' });

  if (error) {
    console.error('[profile] init failed:', error);
    return NextResponse.json({ error: 'Profile init failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, display_name: displayName });
}

export async function PATCH(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { display_name } = await req.json();
  if (!display_name?.trim()) return NextResponse.json({ error: 'Display name is required' }, { status: 422 });

  const admin = createAdminClient();

  const emailEnc = user.email ? encryptEmail(user.email) : '';

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
