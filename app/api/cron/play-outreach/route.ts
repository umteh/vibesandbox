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

interface Draft { subject: string; body: string; }

async function draftEmail(app: AppDetail, genai: GoogleGenerativeAI): Promise<Draft> {
  const model   = genai.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { temperature: 0.7, responseMimeType: 'application/json' } });
  const title   = String(app.title ?? 'your app');
  const summary = String(app.summary ?? '').slice(0, 300);

  const result = await model.generateContent(
    `You are helping VibeSandbox — an AI-powered marketplace where indie builders sell their apps — reach out to indie Android app developers.

Write a short outreach email to the developer of "${title}". The app: ${summary}

Output ONLY valid JSON: { "subject": "...", "body": "..." }

Rules for body (under 120 words):
- Open with a genuine one-line observation about what the app does (not generic praise like "great work")
- Pitch: VibeSandbox lists apps for visibility and potential acquisition, free to list, AI scores the app across 5 buyer-relevant dimensions
- Mention: growing email newsletter that features newly listed apps to potential buyers
- End body with exactly: "Feel free to check it out: https://vibesandbox.store"
- Tone: friendly founder-to-founder, not marketing copy
- Do NOT open with "I hope this email finds you well" or similar filler
- Sign off as: The VibeSandbox team

Rules for subject (under 10 words):
- Specific to the app, not generic
- No "Quick note" or "Hey" openers
- Example: "Your [App Name] — seen on Play Store"`
  );

  try {
    const parsed = JSON.parse(result.response.text().trim()) as { subject?: string; body?: string };
    return {
      subject: parsed.subject ?? `Your app on VibeSandbox marketplace`,
      body:    parsed.body    ?? result.response.text().trim(),
    };
  } catch {
    // Fallback if JSON parse fails
    return {
      subject: `${title} — VibeSandbox marketplace`,
      body:    result.response.text().trim(),
    };
  }
}

// ─── Developer email (plain text body → HTML wrapper) ─────────────────────────

function buildDevEmailHtml(body: string) {
  const lines = body.split('\n').map(l => `<p style="margin:0 0 12px">${l}</p>`).join('');
  return `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;font-size:14px;line-height:1.6;max-width:560px;margin:0 auto;padding:24px;color:#111">
  ${lines}
  <p style="font-size:11px;color:#aaa;border-top:1px solid #eee;margin-top:32px;padding-top:12px">
    You're receiving this because your app is listed on the Google Play Store.<br>
    Reply "unsubscribe" to opt out. VibeSandbox, San Francisco CA.
  </p>
</body>
</html>`;
}

// ─── Summary digest (sent to aichroniclesscout — just a log of what was sent) ──

function buildSummaryHtml(apps: Array<{ app: AppDetail; draft: Draft }>, date: string) {
  const rows = apps.map(({ app, draft }) => {
    const title    = String(app.title ?? '');
    const email    = String(app.developerEmail ?? '');
    const installs = Number(app.minInstalls ?? 0).toLocaleString();
    const appId    = String(app.appId ?? '');
    const url      = `https://play.google.com/store/apps/details?id=${encodeURIComponent(appId)}`;
    return `
<tr>
  <td style="padding:10px 12px;border-bottom:1px solid #eee;font-family:monospace;font-size:13px">
    <a href="${url}" style="color:#111;font-weight:700;text-decoration:none">${title}</a><br>
    <span style="color:#888;font-size:12px">${email} &nbsp;·&nbsp; ${installs}+ installs</span><br>
    <span style="color:#555;font-size:12px;font-style:italic">Subject: ${draft.subject}</span>
  </td>
</tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<body style="font-family:monospace;max-width:640px;margin:0 auto;padding:24px;background:#fff;color:#111">
  <h2 style="font-size:16px;font-weight:900;margin-bottom:4px">VibeSandbox — outreach sent</h2>
  <p style="color:#666;font-size:12px;margin-top:2px;margin-bottom:20px">
    ${date} &nbsp;·&nbsp; ${apps.length} email${apps.length === 1 ? '' : 's'} sent to app developers
  </p>
  <table style="width:100%;border-collapse:collapse;border:2px solid #111">${rows}</table>
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

  // 5. Draft in parallel
  const draftResults = await Promise.allSettled(
    targets.map(async app => {
      const draft = await draftEmail(app, genai);
      return { app, draft };
    })
  );

  const drafted = draftResults
    .filter((r): r is PromiseFulfilledResult<{ app: AppDetail; draft: Draft }> => r.status === 'fulfilled')
    .map(r => r.value);

  console.log(`[play-outreach] drafted=${drafted.length}`);

  if (drafted.length === 0) {
    return NextResponse.json({ ok: true, message: 'All drafts failed', targets: targets.length });
  }

  // 6. Send outreach emails directly to developers + persist results
  const fromAddr = `VibeSandbox <hello@${process.env.RESEND_FROM_DOMAIN}>`;
  const sendResults = await Promise.allSettled(
    drafted.map(async ({ app, draft }) => {
      const devEmail = String(app.developerEmail ?? '');
      const { error } = await resend.emails.send({
        from:    fromAddr,
        to:      devEmail,
        subject: draft.subject,
        html:    buildDevEmailHtml(draft.body),
      });

      const status = error ? 'failed' : 'sent';
      if (error) console.error(`[play-outreach] send failed to ${devEmail}:`, error);

      await admin.from('outreach_targets').upsert({
        app_id:          String(app.appId ?? ''),
        app_name:        String(app.title ?? ''),
        developer_email: devEmail,
        developer:       String(app.developer ?? ''),
        installs:        String(app.minInstalls ?? ''),
        score:           Number(app.score ?? 0),
        drafted_message: draft.body,
        status,
      }, { onConflict: 'source,app_id' });

      return { app, draft, sent: !error };
    })
  );

  const sent = sendResults
    .filter((r): r is PromiseFulfilledResult<{ app: AppDetail; draft: Draft; sent: boolean }> =>
      r.status === 'fulfilled' && r.value.sent)
    .map(r => r.value);

  console.log(`[play-outreach] sent=${sent.length}/${drafted.length}`);

  // 7. Send summary digest to DIGEST_TO
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const html = buildSummaryHtml(sent, date);

  const { error: sendErr } = await resend.emails.send({
    from:    fromAddr,
    to:      DIGEST_TO,
    subject: `VibeSandbox outreach — ${sent.length} emails sent · ${new Date().toLocaleDateString()}`,
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
    drafted: drafted.length,
    sent:    sent.length,
  });
}
