import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { email } = body as { email?: string };

  if (!email?.trim()) {
    return NextResponse.json({ error: 'Email is required' }, { status: 422 });
  }

  const trimmed = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 422 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  const admin = createAdminClient();

  // Rate limit: reject if same email was inserted in the last 60 seconds
  const cutoff = new Date(Date.now() - 60_000).toISOString();
  const { count } = await admin
    .from('email_subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('email', trimmed)
    .gte('created_at', cutoff);

  if (count && count > 0) {
    return NextResponse.json({ message: "You're already on the list." }, { status: 200 });
  }

  const { error } = await admin
    .from('email_subscriptions')
    .insert({ email: trimmed });

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ message: "You're already on the list." }, { status: 200 });
    }
    console.error('Subscribe error:', error);
    return NextResponse.json({ error: 'Failed to subscribe. Try again.' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Subscribed!' }, { status: 201 });
}
