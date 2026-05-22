import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createAdminClient } from '@/lib/supabase/server';
import { fetchAppData } from '@/lib/fetch-app-data';

// Allow up to 60s on Vercel Pro; free tier is capped at 10s regardless
export const maxDuration = 60;

// ─── Scoring rubric ───────────────────────────────────────────────────────────
const RUBRIC = `
You are an expert app marketplace analyst evaluating apps for acquisition potential.
Score the app on 5 dimensions (0–10 each) that matter to buyers and investors.

RUBRIC:
| Dimension          | Weight | 0–3                                         | 4–6                                           | 7–10                                                     |
|--------------------|--------|---------------------------------------------|-----------------------------------------------|----------------------------------------------------------|
| problem_clarity    | 25%    | Vague or me-too problem                     | Real problem, fuzzy audience                  | One sentence that nails who suffers and why              |
| ux_quality         | 20%    | Can't figure out what it does in 30s        | Understandable but clunky                     | Clear in 10s, zero friction to try                       |
| monetization       | 20%    | No pricing, no revenue path                 | Some monetization but model is unclear        | Clear pricing, proven or obvious path to cashflow        |
| market_opportunity | 20%    | Tiny niche or shrinking market              | Real market but crowded with no clear wedge   | Large or fast-growing market with room to capture share  |
| defensibility      | 15%    | Trivial to replicate in a weekend           | Some moat but easily copied with resources    | Proprietary data, switching costs, or unique distribution|

CALIBRATION EXAMPLES:
1. Low (score ~38): Generic "chat with documents" — vague problem, no pricing, tiny moat, crowded market.
   → problem_clarity:4, ux_quality:3, monetization:2, market_opportunity:4, defensibility:3
2. Mid (score ~62): Standup bot pulling from Jira/GitHub. Useful, clear SaaS pricing, but easily replicated.
   → problem_clarity:7, ux_quality:6, monetization:6, market_opportunity:7, defensibility:5
3. High (score ~84): Email assistant trained on writing style. Clear $49/mo pricing, data moat grows over time.
   → problem_clarity:9, ux_quality:8, monetization:8, market_opportunity:7, defensibility:8

IMPORTANT: Be honest and critical. Most apps score 40–75. Reserve 80+ for genuinely acquisition-worthy products.

Return ONLY valid JSON (no markdown, no extra text):
{
  "problem_clarity": <integer 0-10>,
  "ux_quality": <integer 0-10>,
  "monetization": <integer 0-10>,
  "market_opportunity": <integer 0-10>,
  "defensibility": <integer 0-10>,
  "critique": "<2–3 sentence honest assessment covering product quality, revenue potential, and acquisition risk>"
}
`.trim();

// ─── Score calculation ────────────────────────────────────────────────────────
function calcScore(b: Record<string, number>): number {
  const weighted =
    b.problem_clarity    * 0.25 +
    b.ux_quality         * 0.20 +
    b.monetization       * 0.20 +
    b.market_opportunity * 0.20 +
    b.defensibility      * 0.15;
  return Math.round(weighted * 10);
}

// ─── Route ────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-internal-secret');
  if (!process.env.INTERNAL_SECRET || secret !== process.env.INTERNAL_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.GOOGLE_AI_API_KEY) {
    return NextResponse.json({ error: 'GOOGLE_AI_API_KEY not configured' }, { status: 503 });
  }

  const { listing_id, url, description, platform } = await req.json() as {
    listing_id: string;
    url: string;
    description: string;
    platform?: string;
  };
  if (!listing_id || !url) {
    return NextResponse.json({ error: 'listing_id and url required' }, { status: 400 });
  }

  const admin = createAdminClient();

  // ── Fetch enriched app data (store metadata / web meta) ──────────────────
  const [appData] = await Promise.allSettled([
    fetchAppData(url, platform ?? 'web'),
  ]);
  const enriched = appData.status === 'fulfilled' ? appData.value : null;

  // ── Screenshot ────────────────────────────────────────────────────────────
  const { data: listing } = await admin
    .from('listings')
    .select('screenshot_url, screenshot_status')
    .eq('id', listing_id)
    .single();

  let screenshotBase64: string | null = null;
  let screenshotMime = 'image/jpeg';
  let capturedStorageUrl: string | null = listing?.screenshot_url ?? null;

  if (!capturedStorageUrl) {
    try {
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      const res = await fetch(
        `https://api.microlink.io/?url=${encodeURIComponent(fullUrl)}&screenshot=true&meta=false&embed=screenshot.url`,
        { signal: AbortSignal.timeout(10_000) }
      );
      if (res.ok) {
        const buf = await res.arrayBuffer();
        screenshotMime = res.headers.get('content-type') ?? 'image/jpeg';
        screenshotBase64 = Buffer.from(buf).toString('base64');
        const path = `auto/${listing_id}.jpg`;
        const { data: uploaded } = await admin.storage
          .from('screenshots')
          .upload(path, buf, { contentType: screenshotMime, upsert: true });
        if (uploaded) {
          capturedStorageUrl = admin.storage.from('screenshots').getPublicUrl(uploaded.path).data.publicUrl;
        }
      }
    } catch (err) {
      console.warn('[score-listing] screenshot capture failed:', err);
    }
  } else {
    try {
      const res = await fetch(capturedStorageUrl, { signal: AbortSignal.timeout(10_000) });
      if (res.ok) {
        screenshotMime = res.headers.get('content-type') ?? 'image/jpeg';
        screenshotBase64 = Buffer.from(await res.arrayBuffer()).toString('base64');
      }
    } catch {
      console.warn('[score-listing] could not download existing screenshot');
    }
  }

  // ── Build Gemini prompt ───────────────────────────────────────────────────
  const genai = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const model = genai.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
  });

  const platformNote = platform && platform !== 'web'
    ? `\nPlatform: ${platform.toUpperCase()} mobile app.`
    : '';

  const enrichedBlock = enriched?.summary
    ? `\n\n--- ENRICHED APP DATA ---\n${enriched.summary}\n--- END ---`
    : '';

  const promptText = [
    `App URL: ${url}`,
    `Submitted description: ${description || '(none provided)'}`,
    platformNote,
    enrichedBlock,
    '',
    RUBRIC,
  ].join('\n');

  const parts: Parameters<typeof model.generateContent>[0] = [promptText];
  if (screenshotBase64) {
    parts.push({ inlineData: { mimeType: screenshotMime, data: screenshotBase64 } });
  }

  // ── Call Gemini ───────────────────────────────────────────────────────────
  let raw: string;
  try {
    const result = await model.generateContent(parts);
    raw = result.response.text();
  } catch (err) {
    console.error(`[score-listing] Gemini call failed for ${listing_id}:`, err);
    await admin.from('listings').update({ status: 'scoring_failed' }).eq('id', listing_id);
    return NextResponse.json({ error: 'Gemini call failed' }, { status: 500 });
  }

  // ── Parse ─────────────────────────────────────────────────────────────────
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error(`[score-listing] malformed JSON from Gemini for ${listing_id}:`, raw);
    await admin.from('listings').update({ status: 'scoring_failed' }).eq('id', listing_id);
    return NextResponse.json({ error: 'Malformed scoring response' }, { status: 500 });
  }

  const breakdown = {
    problem_clarity:    Number(parsed.problem_clarity    ?? 5),
    ux_quality:         Number(parsed.ux_quality         ?? 5),
    monetization:       Number(parsed.monetization       ?? 5),
    market_opportunity: Number(parsed.market_opportunity ?? 5),
    defensibility:      Number(parsed.defensibility      ?? 5),
  };
  const score   = calcScore(breakdown);
  const critique = String(parsed.critique ?? '');

  const { data: current } = await admin
    .from('listings')
    .select('score_version')
    .eq('id', listing_id)
    .single();

  const updateData: Record<string, unknown> = {
    score,
    score_breakdown_json: breakdown,
    critique,
    status: 'scored',
    last_rescored_at: new Date().toISOString(),
    score_version: (current?.score_version ?? 0) + 1,
  };
  if (capturedStorageUrl && !listing?.screenshot_url) {
    updateData.screenshot_url    = capturedStorageUrl;
    updateData.screenshot_status = 'captured';
  }

  const { error: updateError } = await admin
    .from('listings')
    .update(updateData)
    .eq('id', listing_id);

  if (updateError) {
    console.error(`[score-listing] DB update failed for ${listing_id}:`, updateError);
    return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
  }

  console.log(`[score-listing] ✓ ${listing_id} scored ${score}/100 (enriched: ${!!enriched?.title})`);
  return NextResponse.json({ ok: true, score, breakdown });
}
