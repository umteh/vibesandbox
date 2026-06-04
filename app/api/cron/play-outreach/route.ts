import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Resend } from 'resend';

export const maxDuration = 60;

const DIGEST_TO  = 'aichroniclesscout@gmail.com';
const DAILY_CAP  = 25;

// list() returns minimal fields; app() returns full detail incl. developerEmail + minInstalls
const CATEGORIES   = ['TOOLS', 'PRODUCTIVITY', 'BUSINESS'] as const;
const COLLECTIONS  = ['TOP_FREE', 'GROSSING'] as const;
const LIST_PER_CAT = 50;   // fetch top 50 per category — big apps dominate the top 20
const DETAIL_BATCH = 10;   // parallel app() calls per batch

type ListItem = { appId: string; score: number; title: string; summary: string };
type AppDetail = Record<string, unknown>;

// ─── Scrape list ──────────────────────────────────────────────────────────────

async function getListItems(): Promise<ListItem[]> {
  const gp = (await import('google-play-scraper')).default;
  const gpAny = gp as unknown as Record<string, Record<string, string>>;
  const seen = new Set<string>();
  const results: ListItem[] = [];

  for (const cat of CATEGORIES) {
    for (const col of COLLECTIONS) {
      const apps = (await gp.list({
        category: gpAny.category[cat] as unknown as never,
        collection: gpAny.collection[col] as unknown as never,
        num: LIST_PER_CAT,
        country: 'us',
      })) as Array<{ appId: string; score: number; title: string; summary: string }>;

      for (const a of apps) {
        if (!a.appId || seen.has(a.appId)) continue;
        seen.add(a.appId);
        results.push({ appId: a.appId, score: a.score ?? 0, title: a.title ?? '', summary: a.summary ?? '' });
      }
    }
  }

  // Sort by score descending so we detail-fetch the best ones first
  return results.sort((a, b) => b.score - a.score);
}

// ─── Fetch detail ─────────────────────────────────────────────────────────────

async function fetchDetails(items: ListItem[]): Promise<AppDetail[]> {
  const gp = (await import('google-play-scraper')).default;
  const results: AppDetail[] = [];

  for (let i = 0; i < items.length; i += DETAIL_BATCH) {
    const batch = items.slice(i, i + DETAIL_BATCH);
    const settled = await Promise.allSettled(
      batch.map(item => (gp.app({ appId: item.appId, throttle: 10 }) as unknown) as Promise<AppDetail>)
    );
    settled.forEach(r => {
      if (r.status === 'fulfilled') results.push(r.value);
    });
  }
  return results;
}

// ─── Filter ───────────────────────────────────────────────────────────────────

function isIndieApp(app: AppDetail): boolean {
  const email    = String(app.developerEmail ?? '').toLowerCase();
  const installs = Number(app.minInstalls ?? 0);
  const score    = Number(app.score ?? 0);

  if (!email || email.includes('noreply') || email.includes('no-reply')) return false;
  if (installs < 100 || installs > 1_000_000) return false;
  if (score < 2.5) return false;
  return true;
}

// ─── Draft ────────────────────────────────────────────────────────────────────

async function draftEmail(app: AppDetail, genai: GoogleGenerativeAI): Promise<string> {
  const model   = genai.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { temperature: 0.7 } });
  const title   = String(app.title ?? 'your app');
  const summary = String(app.summary ?? '').slice(0, 300);

  const result = await model.generateContent(
    `You are helping VibeSandbox — an AI-powered marketplace where indie builders sell their apps — reach out to indie Android app developers.

Write a short, friendly outreach email (under 120 words) to the developer of "${title}". The app: ${summary}

Rules:
- Open with a genuine one-line observation about what the app does (not generic praise like "great work" or "nice app")
- Pitch: VibeSandbox lists apps for visibility and potential acquisition, free to list, AI scores the app across 5 buyer-relevant dimensions
- Mention: growing email newsletter that features newly listed apps to potential buyers
- End with exactly: "Feel free to check it out: https://vibesandbox.store"
- Tone: friendly founder-to-founder, not marketing copy
- Do NOT open with "I hope this email finds you well" or similar filler
- Sign off as: The VibeSandbox team`
  );
  return result.response.text().trim();
}

// ─── Digest email ─────────────────────────────────────────────────────────────

function buildDigestHtml(apps: Array<{ app: AppDetail; draft: string }>, date: string) {
  const cards = apps.map(({ app, draft }) => {
    const title    = String(app.title ?? '');
    const genre    = String(app.genre ?? '');
    const email    = String(app.developerEmail ?? '');
    const dev      = String(app.developer ?? '');
    const installs = Number(app.minInstalls ?? 0).toLocaleString();
    const score    = Number(app.score ?? 0).toFixed(1);
    const appId    = String(app.appId ?? '');
    const url      = `https://play.google.com/store/apps/details?id=${encodeURIComponent(appId)}`;

    return `
<div style="border:2px solid #111;padding:20px;margin-bottom:24px;font-family:monospace;font-size:13px">
  <div style="font-size:15px;font-weight:700;margin-bottom:6px">${title}</div>
  <div style="color:#555;margin-bottom:4px">${genre} &nbsp;·&nbsp; ${dev}</div>
  <div style="margin-bottom:4px">📧 <strong>${email}</strong></div>
  <div style="color:#555;margin-bottom:10px">📥 ${installs}+ installs &nbsp;·&nbsp; ⭐ ${score}</div>
  <a href="${url}" style="color:#1a73e8;font-size:12px">Open Play Store listing ↗</a>
  <hr style="border:none;border-top:1px solid #eee;margin:14px 0">
  <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Drafted email — copy &amp; send</div>
  <pre style="white-space:pre-wrap;font-size:13px;background:#f8f8f8;padding:14px;border:1px solid #e0e0e0;margin:0;line-height:1.6">${draft}</pre>
</div>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<body style="font-family:monospace;max-width:700px;margin:0 auto;padding:24px;background:#fff;color:#111">
  <h2 style="font-size:17px;margin-bottom:4px;font-weight:900">VibeSandbox — Play Store outreach</h2>
  <p style="color:#666;font-size:12px;margin-top:2px;margin-bottom:28px">
    ${date} &nbsp;·&nbsp; ${apps.length} indie developer${apps.length === 1 ? '' : 's'} found today
  </p>
  ${cards}
  <p style="font-size:11px;color:#aaa;border-top:1px solid #eee;padding-top:16px;margin-top:8px">
    Review each draft and send manually. Reply "unsubscribe" to stop.
  </p>
</body>
</html>`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const isVercelCron = req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`;
  const isInternal   = req.headers.get('x-internal-secret') === process.env.INTERNAL_SECRET;
  if (!isVercelCron && !isInternal) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.GOOGLE_AI_API_KEY) {
    return NextResponse.json({ error: 'GOOGLE_AI_API_KEY not configured' }, { status: 503 });
  }

  const admin  = createAdminClient();
  const genai  = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const resend = new Resend(process.env.RESEND_API_KEY!);

  // 1. List top apps across categories
  let listItems: ListItem[];
  try {
    listItems = await getListItems();
  } catch (err) {
    console.error('[play-outreach] list failed:', err);
    return NextResponse.json({ error: 'Play Store list failed' }, { status: 500 });
  }

  // 2. Dedup early — skip appIds we've already processed
  const { data: seen } = await admin
    .from('outreach_targets')
    .select('app_id')
    .in('app_id', listItems.map(i => i.appId));
  const seenSet = new Set((seen ?? []).map((r: { app_id: string }) => r.app_id));
  const unseen = listItems.filter(i => !seenSet.has(i.appId));

  console.log(`[play-outreach] listed=${listItems.length} unseen=${unseen.length}`);

  if (unseen.length === 0) {
    return NextResponse.json({ ok: true, message: 'No new targets today', listed: listItems.length });
  }

  // 3. Fetch full details for unseen apps (gets developerEmail + minInstalls)
  let details: AppDetail[];
  try {
    details = await fetchDetails(unseen);
  } catch (err) {
    console.error('[play-outreach] detail fetch failed:', err);
    return NextResponse.json({ error: 'App detail fetch failed' }, { status: 500 });
  }

  // 4. Filter for indie apps with contactable email
  const targets = details.filter(isIndieApp).slice(0, DAILY_CAP);
  console.log(`[play-outreach] details=${details.length} targets=${targets.length}`);

  if (targets.length === 0) {
    // Still record all as seen so we don't re-fetch tomorrow
    await Promise.allSettled(details.map(app =>
      admin.from('outreach_targets').upsert({
        app_id:   String(app.appId ?? ''),
        app_name: String(app.title ?? ''),
        status:   'skipped',
      }, { onConflict: 'source,app_id' })
    ));
    return NextResponse.json({ ok: true, message: 'No indie targets with email', details: details.length });
  }

  // 5. Draft + persist in parallel
  const draftResults = await Promise.allSettled(
    targets.map(async app => {
      const draft = await draftEmail(app, genai);
      await admin.from('outreach_targets').upsert({
        app_id:          String(app.appId ?? ''),
        app_name:        String(app.title ?? ''),
        developer_email: String(app.developerEmail ?? ''),
        developer:       String(app.developer ?? ''),
        installs:        String(app.minInstalls ?? ''),
        score:           Number(app.score ?? 0),
        drafted_message: draft,
      }, { onConflict: 'source,app_id' });
      return { app, draft };
    })
  );

  const drafted = draftResults
    .filter((r): r is PromiseFulfilledResult<{ app: AppDetail; draft: string }> => r.status === 'fulfilled')
    .map(r => r.value);

  console.log(`[play-outreach] drafted=${drafted.length}`);

  if (drafted.length === 0) {
    return NextResponse.json({ ok: true, message: 'All drafts failed', targets: targets.length });
  }

  // 6. Send digest
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const html = buildDigestHtml(drafted, date);

  const { error: sendErr } = await resend.emails.send({
    from:    `VibeSandbox <noreply@${process.env.RESEND_FROM_DOMAIN}>`,
    to:      DIGEST_TO,
    subject: `VibeSandbox outreach — ${drafted.length} new apps · ${new Date().toLocaleDateString()}`,
    html,
  });

  if (sendErr) {
    console.error('[play-outreach] resend failed:', sendErr);
    return NextResponse.json({ error: 'Email send failed' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    listed:  listItems.length,
    unseen:  unseen.length,
    targets: targets.length,
    emailed: drafted.length,
  });
}
