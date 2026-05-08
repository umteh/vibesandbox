import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyScoreCallback } from '@/lib/hmac';

interface ScoreBreakdown {
  problem_clarity: number;
  ux_quality: number;
  ai_integration: number;
  polish: number;
  novelty: number;
}

interface ScorePayload {
  score: number;
  breakdown: ScoreBreakdown;
  critique: string;
  screenshot_url?: string;
  screenshot_status?: string;
  timestamp: number;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const listingId = params.id;
  const signature = req.headers.get('x-scorer-hmac');

  let body: ScorePayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { score, breakdown, critique, screenshot_url, screenshot_status, timestamp } = body;

  // Reconstruct the exact JSON string the worker signed
  const scoreJson = JSON.stringify({ score, breakdown, critique });
  const hmacError = verifyScoreCallback(signature, listingId, scoreJson, timestamp);
  if (hmacError) {
    console.warn(`[score] HMAC validation failed for listing ${listingId}: ${hmacError}`);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Validate score payload
  if (typeof score !== 'number' || score < 0 || score > 100) {
    return NextResponse.json({ error: 'score must be 0-100' }, { status: 422 });
  }
  if (!critique || typeof critique !== 'string') {
    return NextResponse.json({ error: 'critique is required' }, { status: 422 });
  }

  const admin = createAdminClient();

  const updateData: Record<string, unknown> = {
    score,
    score_breakdown_json: breakdown,
    critique,
    status: 'scored',
    last_rescored_at: new Date().toISOString(),
  };

  // Only bump score_version for existing scored listings (re-score)
  const { data: current } = await admin
    .from('listings')
    .select('score_version, status')
    .eq('id', listingId)
    .single();

  if (current) {
    updateData.score_version = (current.score_version ?? 0) + 1;
  }

  if (screenshot_url) updateData.screenshot_url = screenshot_url;
  if (screenshot_status) updateData.screenshot_status = screenshot_status;

  const { error } = await admin
    .from('listings')
    .update(updateData)
    .eq('id', listingId);

  if (error) {
    console.error(`[score] update failed for listing ${listingId}:`, error);
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
