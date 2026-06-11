import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = req.nextUrl;
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  const secret = process.env.OPT_OUT_SECRET;
  if (!secret) {
    console.error('[remove] OPT_OUT_SECRET not configured');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  // Token format: <hmac>.<expiry_unix_seconds>
  const dotIdx = token.lastIndexOf('.');
  if (dotIdx === -1) {
    return gone();
  }

  const sig = token.slice(0, dotIdx);
  const expiryStr = token.slice(dotIdx + 1);
  const expiry = parseInt(expiryStr, 10);

  if (isNaN(expiry) || Date.now() / 1000 > expiry) {
    return gone();
  }

  const expected = createHmac('sha256', secret)
    .update(`${params.id}|${expiryStr}`)
    .digest('hex');

  const sigBuf      = Buffer.from(sig, 'hex');
  const expectedBuf = Buffer.from(expected, 'hex');

  // Reject if lengths differ (prevents timingSafeEqual throwing)
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return gone();
  }

  const admin = createAdminClient();
  const { error } = await admin.from('listings').delete().eq('id', params.id);

  if (error) {
    console.error('[remove] delete failed:', error);
    return NextResponse.json({ error: 'Failed to remove listing' }, { status: 500 });
  }

  return NextResponse.redirect(
    new URL('/listings/removed', req.url),
    { status: 302 }
  );
}

function gone() {
  return new NextResponse(
    `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:480px;margin:80px auto;padding:24px">
      <h2>This opt-out link has expired or is invalid</h2>
      <p>To remove your listing, email <a href="mailto:support@vibesandbox.store">support@vibesandbox.store</a> and include your app name.</p>
    </body></html>`,
    { status: 410, headers: { 'Content-Type': 'text/html' } }
  );
}
