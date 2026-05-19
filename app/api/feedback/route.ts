import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { message, email, type } = body as { message?: string; email?: string; type?: string };

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 422 });
  }

  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()).filter(Boolean) ?? [];

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_DOMAIN || adminEmails.length === 0) {
    console.log('[feedback] received (email not configured):', { type, email, message });
    return NextResponse.json({ ok: true });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const tag = type ? `[${type}] ` : '';
  const from = email?.trim() || 'anonymous';

  const { error } = await resend.emails.send({
    from: `VibeSandbox Feedback <relay@${process.env.RESEND_FROM_DOMAIN}>`,
    to: adminEmails,
    replyTo: email?.trim() || undefined,
    subject: `${tag}Feedback from ${from}`,
    text: [
      `Type: ${type || 'General'}`,
      `From: ${from}`,
      '',
      message.trim(),
    ].join('\n'),
  });

  if (error) {
    const detail = (error as { message?: string }).message ?? JSON.stringify(error);
    console.error('[feedback] Resend error:', detail);
    return NextResponse.json({ error: `Failed to send: ${detail}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
