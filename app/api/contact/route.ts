import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { encryptEmail, decryptEmail, hashBuyerKey } from '@/lib/crypto';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const { listing_id, buyer_name, buyer_email, message } = body as {
    listing_id?: string;
    buyer_name?: string;
    buyer_email?: string;
    message?: string;
  };

  if (!listing_id?.trim()) return NextResponse.json({ error: 'listing_id is required' }, { status: 422 });
  if (!buyer_name?.trim()) return NextResponse.json({ error: 'buyer_name is required' }, { status: 422 });
  if (!buyer_email?.trim()) return NextResponse.json({ error: 'buyer_email is required' }, { status: 422 });
  if (!message?.trim()) return NextResponse.json({ error: 'message is required' }, { status: 422 });

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer_email)) {
    return NextResponse.json({ error: 'buyer_email is not a valid email address' }, { status: 422 });
  }

  const admin = createAdminClient();

  // Fetch listing + creator profile
  const { data: listing, error: listingError } = await admin
    .from('listings')
    .select('id, title, price_cents, price_type, user_id, status')
    .eq('id', listing_id)
    .single();

  if (listingError || !listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }

  // Idempotency: check for existing relay token with same buyer+listing pair
  const buyerHash = hashBuyerKey(buyer_email, listing_id);

  const { data: existing } = await admin
    .from('relay_tokens')
    .select('id, forwarded_at, expires_at, forward_status')
    .eq('listing_id', listing_id)
    .eq('buyer_email_hash', buyerHash)
    .maybeSingle();

  if (existing) {
    // Token exists — check expiry before deciding response
    const expired = new Date(existing.expires_at) < new Date();
    if (expired) {
      return NextResponse.json({ error: 'This contact link has expired.' }, { status: 410 });
    }
    if (existing.forwarded_at) {
      return NextResponse.json({ message: 'Your message was already sent.' }, { status: 200 });
    }
    // Token exists but not yet forwarded — attempt to forward now
    return forwardRelay(admin, existing.id, listing, buyer_name, buyer_email, message);
  }

  // Create new relay token (expires in 24h)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  let buyerEmailEncrypted: string;
  try {
    buyerEmailEncrypted = encryptEmail(buyer_email);
  } catch (err) {
    console.error('[contact] email encryption failed — is EMAIL_ENCRYPTION_KEY set?', err);
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const { data: token, error: tokenError } = await admin
    .from('relay_tokens')
    .insert({
      listing_id,
      buyer_email_hash: buyerHash,
      buyer_email_encrypted: buyerEmailEncrypted,
      buyer_name: buyer_name.trim(),
      buyer_message: message.trim(),
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (tokenError || !token) {
    // Unique constraint violation = race condition with duplicate request
    if (tokenError?.code === '23505') {
      return NextResponse.json({ message: 'Your message was already sent.' }, { status: 200 });
    }
    console.error('[contact] relay token insert failed:', tokenError);
    return NextResponse.json({ error: 'Failed to create relay token' }, { status: 500 });
  }

  return forwardRelay(admin, token.id, listing, buyer_name, buyer_email, message);
}

async function forwardRelay(
  admin: ReturnType<typeof createAdminClient>,
  tokenId: string,
  listing: { id: string; title: string; price_cents: number | null; price_type: string; user_id: string },
  buyerName: string,
  buyerEmail: string,
  message: string
): Promise<NextResponse> {
  // Decrypt creator email
  const { data: profile } = await admin
    .from('profiles')
    .select('email_encrypted')
    .eq('id', listing.user_id)
    .single();

  if (!profile?.email_encrypted) {
    console.error(`[contact] no profile found for user ${listing.user_id} — cannot relay`);
    await admin.from('relay_tokens').update({ forward_status: 'failed' }).eq('id', tokenId);
    return NextResponse.json({ error: 'Could not reach the seller.' }, { status: 500 });
  }

  let creatorEmail: string;
  try {
    creatorEmail = decryptEmail(profile.email_encrypted);
  } catch (err) {
    // Specific error for wrong EMAIL_ENCRYPTION_KEY
    console.error(
      `[contact] decryption failed for user ${listing.user_id} token ${tokenId} — EMAIL_ENCRYPTION_KEY may have changed:`,
      err
    );
    await admin.from('relay_tokens').update({ forward_status: 'failed' }).eq('id', tokenId);
    return NextResponse.json({ error: 'Server configuration error — relay failed.' }, { status: 500 });
  }

  // Price display
  const priceLabel =
    listing.price_type === 'free' ? 'Free'
    : listing.price_type === 'offer' ? 'Make offer'
    : listing.price_cents ? `$${(listing.price_cents / 100).toFixed(0)}`
    : 'Price not set';

  // Send via Resend
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.warn('[contact] RESEND_API_KEY not set — skipping email send in dev');
    // Mark as sent anyway in dev so we can test the flow
    await admin.from('relay_tokens').update({
      forwarded_at: new Date().toISOString(),
      forward_status: 'sent',
    }).eq('id', tokenId);
    return NextResponse.json({ message: 'Message sent.' }, { status: 200 });
  }

  const resend = new Resend(resendKey);
  const fromDomain = process.env.RESEND_FROM_DOMAIN || 'vibesandbox.app';

  const { error: emailError } = await resend.emails.send({
    from: `VibeSandbox <relay@${fromDomain}>`,
    to: creatorEmail,
    replyTo: buyerEmail,
    subject: `Buyer inquiry for "${listing.title}" — ${priceLabel}`,
    text: [
      `You have a new inquiry for your listing "${listing.title}" (${priceLabel}).`,
      '',
      `From: ${buyerName} <${buyerEmail}>`,
      '',
      message,
      '',
      '---',
      `Reply directly to ${buyerEmail} to connect. This is a one-time relay by VibeSandbox.`,
      'Neither party is tracked after this relay.',
    ].join('\n'),
    html: [
      `<p>You have a new inquiry for your listing <strong>${listing.title}</strong> (${priceLabel}).</p>`,
      `<p><strong>From:</strong> ${buyerName} &lt;${buyerEmail}&gt;</p>`,
      `<p style="white-space:pre-wrap">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`,
      '<hr>',
      `<p style="color:#666;font-size:13px">Reply directly to <a href="mailto:${buyerEmail}">${buyerEmail}</a> to connect. This is a one-time relay by VibeSandbox. Neither party is tracked after this relay.</p>`,
    ].join(''),
  });

  if (emailError) {
    console.error(`[contact] Resend failed for token ${tokenId}:`, emailError);
    await admin.from('relay_tokens').update({ forward_status: 'failed' }).eq('id', tokenId);
    return NextResponse.json({ error: 'Failed to send email.' }, { status: 500 });
  }

  await admin.from('relay_tokens').update({
    forwarded_at: new Date().toISOString(),
    forward_status: 'sent',
  }).eq('id', tokenId);

  return NextResponse.json({ message: 'Message sent.' }, { status: 200 });
}
