import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { encryptEmail } from '@/lib/crypto';

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/feed';

  if (code) {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Upsert encrypted email into profiles
      try {
        const admin = createAdminClient();
        const emailEnc = encryptEmail(data.user.email ?? '');
        const displayName =
          (data.user.user_metadata?.full_name as string) ||
          (data.user.user_metadata?.name as string) ||
          data.user.email?.split('@')[0] ||
          'Anonymous';

        // Insert on first login; on subsequent logins only refresh email_encrypted.
        // display_name is intentionally excluded from the update so user changes persist.
        const { data: existing } = await admin
          .from('profiles').select('id').eq('id', data.user.id).single();

        if (existing) {
          await admin.from('profiles')
            .update({ email_encrypted: emailEnc })
            .eq('id', data.user.id);
        } else {
          await admin.from('profiles').insert({
            id: data.user.id,
            display_name: displayName,
            email_encrypted: emailEnc,
          });
        }
      } catch (err) {
        // Non-fatal: log and continue. Relay won't work for this user until fixed.
        console.error('[auth/callback] profile upsert failed:', err);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/feed?error=auth_failed`);
}
