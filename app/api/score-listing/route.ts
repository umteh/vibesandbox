import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createAdminClient } from '@/lib/supabase/server';

// ─── Scoring rubric ───────────────────────────────────────────────────────────
const RUBRIC = `
You are an expert AI app critic. Score the submitted app on 5 dimensions (0-10 each).

RUBRIC:
| Dimension       | Weight | 0-3                                      | 4-6                                     | 7-10                                               |
|-----------------|--------|------------------------------------------|-----------------------------------------|----------------------------------------------------|
| problem_clarity | 25%    | Vague or me-too problem                  | Specific problem, fuzzy audience        | One sentence that nails who suffers and why        |
| ux_quality      | 25%    | Can't figure out what it does in 30s     | Understandable but clunky               | Clear in 10s, zero friction to try                 |
| ai_integration  | 20%    | AI is cosmetic (chatbot wrapper)         | AI does real work but replaceable       | AI is the core differentiator, irreplaceable       |
| polish          | 15%    | Broken states, misaligned UI, typos      | Works but feels unfinished              | Feels like a product someone shipped with pride    |
| novelty         | 15%    | Duplicate of existing product            | Unique angle on known problem           | New framing or new problem nobody solved           |

CALIBRATION EXAMPLES:
1. Low (score ~38): A generic "chat with your documents" app with no differentiation, confusing onboarding, basic UI.
   → problem_clarity:4, ux_quality:3, ai_integration:4, polish:3, novelty:3
2. Mid (score ~62): A standup bot that pulls from Jira/GitHub. Useful, but the AI mostly templates. Clean enough UI.
   → problem_clarity:7, ux_quality:6, ai_integration:5, polish:6, novelty:6
3. High (score ~84): An email reply assistant that trains on your writing style. Instant value, deep AI integration.
   → problem_clarity:9, ux_quality:8, ai_integration:9, polish:8, novelty:7

IMPORTANT: Be honest and critical. Most apps score between 40-75. Reserve 80+ for genuinely exceptional work.

Return ONLY valid JSON with this exact shape (no markdown, no extra text):
{
  "problem_clarity": <integer 0-10>,
  "ux_quality": <integer 0-10>,
  "ai_integration": <integer 0-10>,
  "polish": <integer 0-10>,
  "novelty": <integer 0-10>,
  "critique": "<1-2 paragraph honest assessment — what works, what doesn't, why>"
}
`.trim();

// ─── Score calculation ────────────────────────────────────────────────────────
function calcScore(b: Record<string, number>): number {
  const weighted =
    b.problem_clarity * 0.25 +
    b.ux_quality      * 0.25 +
    b.ai_integration  * 0.20 +
    b.polish          * 0.15 +
    b.novelty         * 0.15;
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

  const { data: listing } = await admin
    .from('listings')
    .select('screenshot_url, screenshot_status')
    .eq('id', listing_id)
    .single();

  let screenshotBase64: string | null = null;
  let screenshotMime = 'image/jpeg';
  let capturedStorageUrl: string | null = listing?.screenshot_url ?? null;

  // Capture screenshot if not already stored
  if (!capturedStorageUrl) {
    try {
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      const res = await fetch(
        `https://api.microlink.io/?url=${encodeURIComponent(fullUrl)}&screenshot=true&meta=false&embed=screenshot.url`,
        { signal: AbortSignal.timeout(20_000) }
      );
      if (res.ok) {
        const buf = await res.arrayBuffer();
        screenshotMime = res.headers.get('content-type') ?? 'image/jpeg';
        screenshotBase64 = Buffer.from(buf).toString('base64');

        // Upload to Supabase Storage
        const path = `auto/${listing_id}.jpg`;
        const { data: uploaded } = await admin.storage
          .from('screenshots')
          .upload(path, buf, { contentType: screenshotMime, upsert: true });
        if (uploaded) {
          capturedStorageUrl = admin.storage.from('screenshots').getPublicUrl(uploaded.path).data.publicUrl;
        }
      }
    } catch (err) {
      console.warn('[score-listing] screenshot capture failed, scoring from description only:', err);
    }
  } else {
    // Download existing screenshot for Gemini (needs inline data)
    try {
      const res = await fetch(capturedStorageUrl, { signal: AbortSignal.timeout(10_000) });
      if (res.ok) {
        screenshotMime = res.headers.get('content-type') ?? 'image/jpeg';
        screenshotBase64 = Buffer.from(await res.arrayBuffer()).toString('base64');
      }
    } catch {
      console.warn('[score-listing] could not download existing screenshot, scoring from description only');
    }
  }

  // Build Gemini prompt parts
  const genai = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const model = genai.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
  });

  const platformNote = platform && platform !== 'web'
    ? `\nPlatform: ${platform.toUpperCase()} mobile app — evaluate UX against mobile conventions (touch targets, navigation patterns, App Store/Play Store norms).`
    : '';

  const parts: Parameters<typeof model.generateContent>[0] = [
    `App URL: ${url}\nApp description: ${description || '(no description provided)'}${platformNote}\n\n${RUBRIC}`,
  ];

  if (screenshotBase64) {
    parts.push({ inlineData: { mimeType: screenshotMime, data: screenshotBase64 } });
  }

  // Call Gemini
  let raw: string;
  try {
    const result = await model.generateContent(parts);
    raw = result.response.text();
  } catch (err) {
    console.error(`[score-listing] Gemini call failed for ${listing_id}:`, err);
    await admin.from('listings').update({ status: 'scoring_failed' }).eq('id', listing_id);
    return NextResponse.json({ error: 'Gemini call failed' }, { status: 500 });
  }

  // Parse response
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error(`[score-listing] malformed JSON from Gemini for ${listing_id}:`, raw);
    await admin.from('listings').update({ status: 'scoring_failed' }).eq('id', listing_id);
    return NextResponse.json({ error: 'Malformed scoring response' }, { status: 500 });
  }

  const breakdown = {
    problem_clarity: Number(parsed.problem_clarity ?? 5),
    ux_quality:      Number(parsed.ux_quality      ?? 5),
    ai_integration:  Number(parsed.ai_integration  ?? 5),
    polish:          Number(parsed.polish           ?? 5),
    novelty:         Number(parsed.novelty          ?? 5),
  };
  const score = calcScore(breakdown);
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
    updateData.screenshot_url = capturedStorageUrl;
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

  console.log(`[score-listing] ✓ ${listing_id} scored ${score}/100`);
  return NextResponse.json({ ok: true, score, breakdown });
}
