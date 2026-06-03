import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fetchAppData } from '@/lib/fetch-app-data';
import { createAdminClient } from '@/lib/supabase/server';

export const maxDuration = 60;

const RATE_LIMIT = 5;       // requests
const WINDOW_MS  = 60 * 60 * 1000; // 1 hour

const VALUATION_PROMPT = `
You are a marketplace valuation expert for indie and AI-powered apps.
Given the following app data, estimate a realistic acquisition price range.
Output ONLY valid JSON: { "low": number, "high": number, "rationale": ["string","string","string"], "confidence": "low"|"medium"|"high" }

Rules:
- Apps with stated MRR: use 2–5x ARR. Confidence = high.
- Apps with install/traffic data but no MRR: proxy ARPU $0.50–$3/MAU for consumer, $5–$20/MAU for B2B. Confidence = medium.
- Apps with no revenue signals: use engagement quality signals only. Cap high end at $5,000. Confidence = low.
- Rationale: exactly 3 short bullets explaining the range, referencing actual data points provided.
- Never fabricate metrics not in the input. Never use round numbers.
`.trim();

type Confidence = 'low' | 'medium' | 'high';

function normalizeConfidence(v: unknown): Confidence {
  if (v === 'low' || v === 'medium' || v === 'high') return v;
  return 'low';
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

export async function POST(req: NextRequest) {
  if (!process.env.GOOGLE_AI_API_KEY) {
    return NextResponse.json({ error: 'GOOGLE_AI_API_KEY not configured' }, { status: 503 });
  }

  // ── Rate limiting ────────────────────────────────────────────────────────────
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const admin  = createAdminClient();
    const ip     = getIp(req);
    const cutoff = new Date(Date.now() - WINDOW_MS).toISOString();

    const { count } = await admin
      .from('estimate_requests')
      .select('id', { count: 'exact', head: true })
      .eq('ip', ip)
      .gte('created_at', cutoff);

    if ((count ?? 0) >= RATE_LIMIT) {
      return NextResponse.json(
        { error: 'Rate limit reached. Try again in an hour.' },
        { status: 429 }
      );
    }

    await admin.from('estimate_requests').insert({ ip });
  }

  // ── Parse body ───────────────────────────────────────────────────────────────
  let body: { url?: string; platform?: string; monthly_visitors?: number; mrr?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { url, platform = 'web', monthly_visitors, mrr } = body;

  if (!url?.trim()) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 });
  }

  // ── Fetch app data ───────────────────────────────────────────────────────────
  let appData;
  try {
    appData = await fetchAppData(url.trim(), platform);
  } catch (err) {
    console.error('[estimate] fetchAppData threw:', err);
    return NextResponse.json({ error: 'Something went wrong fetching app data' }, { status: 500 });
  }

  if (appData.summary.startsWith('(')) {
    return NextResponse.json({ error: appData.summary }, { status: 422 });
  }

  // ── Build prompt ─────────────────────────────────────────────────────────────
  const extras = [
    monthly_visitors != null ? `Monthly visitors (self-reported): ${monthly_visitors.toLocaleString()}` : '',
    mrr != null ? `Monthly Recurring Revenue (MRR, self-reported): $${mrr.toLocaleString()}` : '',
  ].filter(Boolean).join('\n');

  const promptText = [
    '--- APP DATA ---',
    appData.summary,
    extras ? `\n--- SELLER-PROVIDED METRICS ---\n${extras}` : '',
    '--- END ---',
    '',
    VALUATION_PROMPT,
  ].join('\n');

  // ── Call Gemini ──────────────────────────────────────────────────────────────
  const genai = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const model = genai.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
  });

  let raw: string;
  try {
    const result = await model.generateContent(promptText);
    raw = result.response.text();
  } catch (err) {
    console.error('[estimate] Gemini call failed:', err);
    return NextResponse.json({ error: 'Valuation service unavailable' }, { status: 500 });
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error('[estimate] malformed Gemini response:', raw);
    return NextResponse.json({ error: 'Malformed valuation response' }, { status: 500 });
  }

  const low        = Number(parsed.low ?? 0);
  const high       = Number(parsed.high ?? 0);
  const rationale  = Array.isArray(parsed.rationale)
    ? (parsed.rationale as unknown[]).slice(0, 3).map(String)
    : [];
  const confidence = normalizeConfidence(parsed.confidence);

  return NextResponse.json({ low, high, rationale, confidence });
}
