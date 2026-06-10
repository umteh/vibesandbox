import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Resend } from 'resend';
import { createHmac } from 'crypto';

export const maxDuration = 60;

const DIGEST_TO  = 'aichroniclesscout@gmail.com';
const DAILY_CAP      = 70;

// list() returns minimal fields; app() returns full detail incl. developerEmail + minInstalls
const CATEGORIES     = ['TOOLS', 'PRODUCTIVITY', 'BUSINESS', 'EDUCATION', 'FINANCE', 'LIFESTYLE', 'HEALTH_AND_FITNESS'] as const;
const COLLECTIONS    = ['TOP_FREE', 'GROSSING'] as const;
const LIST_PER_CAT   = 50;   // fetch top 50 per category — big apps dominate the top 20
const MAX_TO_DETAIL  = 40;   // only detail-fetch top 40 by score — keeps us well under 60s
const DETAIL_BATCH   = 15;   // parallel app() calls per batch

// Opt-out token TTL: 30 days
const OPT_OUT_TTL_SECONDS = 30 * 24 * 60 * 60;

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
  if (installs < 100 || installs > 100_000) return false;
  if (score < 2.5) return false;
  return true;
}

// ─── Opt-out token ────────────────────────────────────────────────────────────

function buildOptOutToken(listingId: string): string {
  const secret = process.env.OPT_OUT_SECRET ?? process.env.INTERNAL_SECRET ?? '';
  const expiry = Math.floor(Date.now() / 1000) + OPT_OUT_TTL_SECONDS;
  const sig = createHmac('sha256', secret).update(`${listingId}|${expiry}`).digest('hex');
  return `${sig}.${expiry}`;
}

// ─── Draft + listing content ──────────────────────────────────────────────────

interface DraftResult {
  subject: string;
  body: string;
  marketplaceDescription: string;
  buyerCritique: string;
}

async function draftContent(app: AppDetail, genai: GoogleGenerativeAI): Promise<DraftResult> {
  const model   = genai.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { temperature: 0.7, responseMimeType: 'application/json' } });
  const title   = String(app.title ?? 'your app');
  const summary = String(app.summary ?? '').slice(0, 300);
  const genre   = String(app.genre ?? app.genreId ?? 'Productivity');
  const installs = Number(app.minInstalls ?? 0).toLocaleString();
  const rating   = Number(app.score ?? 0).toFixed(1);
  const ratings  = Number(app.ratings ?? 0).toLocaleString();
  const description = String(app.description ?? summary).slice(0, 500);

  const result = await model.generateContent(
    `You are writing content for VibeSandbox, an indie app marketplace where apps are bought and sold.

App: "${title}"
Category: ${genre}
Installs: ${installs}+
Rating: ${rating}/5 from ${ratings} reviews
Play Store description: ${description}

Output ONLY valid JSON:
{
  "personalizedOpener": "...",
  "marketplaceDescription": "...",
  "buyerCritique": "..."
}

Rules:
- personalizedOpener: 1-2 sentences. A genuine, specific observation about what this app does or who it helps. Must reference something concrete from the description. Do NOT use generic praise. Do NOT mention VibeSandbox. Tone: casual, human, one founder noticing another's work.
- marketplaceDescription: 2-3 sentences from a buyer's perspective — what the app does, who its users are, and why it has real value as an acquisition.
- buyerCritique: 3-4 sentences on what makes this app attractive to buy — focus on what's working (distribution, loyal users, niche, revenue signal). Do NOT mention weaknesses. Write as if you're a deal scout excited about this find.`
  );

  try {
    const parsed = JSON.parse(result.response.text().trim()) as {
      personalizedOpener?: string;
      marketplaceDescription?: string;
      buyerCritique?: string;
    };

    const marketplaceDescription = (parsed.marketplaceDescription ?? '').trim();
    const buyerCritique          = (parsed.buyerCritique ?? '').trim();
    const personalizedOpener     = (parsed.personalizedOpener ?? '').trim();

    return {
      subject:                `We listed ${title} on VibeSandbox — see what buyers think`,
      body:                   personalizedOpener,
      marketplaceDescription,
      buyerCritique,
    };
  } catch {
    return {
      subject:                `We listed ${title} on VibeSandbox — see what buyers think`,
      body:                   '',
      marketplaceDescription: '',
      buyerCritique:          '',
    };
  }
}

// ─── Developer email ──────────────────────────────────────────────────────────

function buildDevEmailHtml(params: {
  opener: string;
  title: string;
  listingUrl: string;
  optOutUrl: string;
}) {
  const { opener, title, listingUrl, optOutUrl } = params;
  return `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;font-size:14px;line-height:1.6;max-width:560px;margin:0 auto;padding:24px;color:#111">
  <p style="margin:0 0 16px">Hi there,</p>
  ${opener ? `<p style="margin:0 0 16px">${opener}</p>` : ''}
  <p style="margin:0 0 16px">I run VibeSandbox, a marketplace where indie app developers list projects to gauge buyer interest and get a sense of market value.</p>
  <p style="margin:0 0 16px">We went ahead and created a listing for <strong>${title}</strong> — see what buyers think and what AI says about its acquisition value:</p>
  <p style="margin:0 0 16px"><a href="${listingUrl}" style="color:#111;font-weight:700">${listingUrl}</a></p>
  <p style="margin:0 0 16px">The full AI score is locked until you claim the listing. Takes 30 seconds — no credit card, no commitment. Even if selling isn't on your radar, it's worth knowing what your app is worth.</p>
  <p style="margin:0 0 4px">Best,</p>
  <p style="margin:0 0 32px">Sophia</p>
  <p style="font-size:11px;color:#aaa;border-top:1px solid #eee;padding-top:12px">
    You're receiving this because your app is listed on the Google Play Store.<br>
    <a href="${optOutUrl}" style="color:#aaa">Remove this listing</a> · Reply "unsubscribe" to opt out of future emails. VibeSandbox, San Francisco CA.
  </p>
</body>
</html>`;
}

// ─── Summary digest ────────────────────────────────────────────────────────────

function buildSummaryHtml(apps: Array<{ app: AppDetail; draft: DraftResult; listingId: string | null }>, date: string) {
  const rows = apps.map(({ app, draft, listingId }) => {
    const title    = String(app.title ?? '');
    const email    = String(app.developerEmail ?? '');
    const installs = Number(app.minInstalls ?? 0).toLocaleString();
    const appId    = String(app.appId ?? '');
    const url      = `https://play.google.com/store/apps/details?id=${encodeURIComponent(appId)}`;
    const listingNote = listingId ? `listing: /listings/${listingId}` : 'listing: skipped (Gemini failed)';
    return `
<tr>
  <td style="padding:10px 12px;border-bottom:1px solid #eee;font-family:monospace;font-size:13px">
    <a href="${url}" style="color:#111;font-weight:700;text-decoration:none">${title}</a><br>
    <span style="color:#888;font-size:12px">${email} &nbsp;·&nbsp; ${installs}+ installs</span><br>
    <span style="color:#555;font-size:12px;font-style:italic">Subject: ${draft.subject}</span><br>
    <span style="color:#666;font-size:11px">${listingNote}</span>
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vibesandbox.store';
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
  // Take top MAX_TO_DETAIL by score — fetching all 250+ would exceed 60s timeout
  const unseen = listItems.filter(i => !seenSet.has(i.appId)).slice(0, MAX_TO_DETAIL);

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
    await Promise.allSettled(details.map(app =>
      admin.from('outreach_targets').upsert({
        app_id:   String(app.appId ?? ''),
        app_name: String(app.title ?? ''),
        status:   'skipped',
      }, { onConflict: 'source,app_id' })
    ));
    return NextResponse.json({ ok: true, message: 'No indie targets with email', details: details.length });
  }

  // 5. Pre-check: skip apps that already have a listing
  const { data: existingListings } = await admin
    .from('listings')
    .select('source_app_id, id')
    .in('source_app_id', targets.map(a => String(a.appId ?? '')));
  const existingMap = new Map(
    (existingListings ?? []).map((r: { source_app_id: string; id: string }) => [r.source_app_id, r.id])
  );

  // 6. Draft content in parallel (email opener + marketplace description + buyer critique)
  const draftResults = await Promise.allSettled(
    targets.map(async app => {
      const draft = await draftContent(app, genai);
      return { app, draft };
    })
  );

  const drafted = draftResults
    .filter((r): r is PromiseFulfilledResult<{ app: AppDetail; draft: DraftResult }> => r.status === 'fulfilled')
    .map(r => r.value);

  console.log(`[play-outreach] drafted=${drafted.length}`);

  if (drafted.length === 0) {
    return NextResponse.json({ ok: true, message: 'All drafts failed', targets: targets.length });
  }

  // 7. Create listings + send emails
  const fromAddr = `Sophia at VibeSandbox <sophia@${process.env.RESEND_FROM_DOMAIN}>`;

  const sendResults = await Promise.allSettled(
    drafted.map(async ({ app, draft }) => {
      const appId    = String(app.appId ?? '');
      const devEmail = String(app.developerEmail ?? '');

      // Determine listing ID — use existing or create new
      let listingId: string | null = existingMap.get(appId) ?? null;

      if (!listingId && draft.marketplaceDescription && draft.buyerCritique) {
        // Create a new unclaimed listing
        try {
          const screenshots = (app.screenshots as string[] | undefined) ?? [];
          const screenshotUrl = screenshots[0] ?? null;

          const devName     = String(app.developer ?? 'App Developer');
          const initials    = devName.split(' ').slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('') || 'AD';

          const { data: newListing, error: insertErr } = await admin
            .from('listings')
            .insert({
              title:              String(app.title ?? ''),
              url:                `play.google.com/store/apps/details?id=${appId}`,
              description:        draft.marketplaceDescription,
              critique:           draft.buyerCritique,
              category:           mapGenreToCategory(String(app.genre ?? app.genreId ?? '')),
              price_type:         'offer',
              status:             'not_for_sale',
              source_app_id:      appId,
              screenshot_url:     screenshotUrl,
              screenshot_status:  screenshotUrl ? 'captured' : 'pending',
              platform:           'android',
              creator_name:       devName,
              creator_initials:   initials,
              tags:               [],
              listing_metadata:   {},
              // user_id intentionally null — unclaimed
            })
            .select('id')
            .single();

          if (insertErr) {
            console.error(`[play-outreach] listing insert failed for ${appId}:`, insertErr);
          } else {
            listingId = newListing?.id ?? null;
          }
        } catch (err) {
          console.error(`[play-outreach] listing insert threw for ${appId}:`, err);
        }
      }

      // Build email URL — link to specific listing if we have one, else /feed
      const listingUrl = listingId
        ? `${siteUrl}/listings/${listingId}`
        : `${siteUrl}/feed`;

      const optOutUrl = listingId
        ? `${siteUrl}/api/listings/${listingId}/remove?token=${buildOptOutToken(listingId)}`
        : `${siteUrl}/feed`;

      const { error } = await resend.emails.send({
        from:    fromAddr,
        to:      devEmail,
        replyTo: 'aichroniclesscout@gmail.com',
        subject: draft.subject,
        html:    buildDevEmailHtml({ opener: draft.body, title: String(app.title ?? ''), listingUrl, optOutUrl }),
      });

      const status = error ? 'failed' : 'sent';
      if (error) console.error(`[play-outreach] send failed to ${devEmail}:`, error);

      await admin.from('outreach_targets').upsert({
        app_id:          appId,
        app_name:        String(app.title ?? ''),
        developer_email: devEmail,
        developer:       String(app.developer ?? ''),
        installs:        String(app.minInstalls ?? ''),
        score:           Number(app.score ?? 0),
        drafted_message: draft.body,
        status,
      }, { onConflict: 'source,app_id' });

      return { app, draft, listingId, sent: !error };
    })
  );

  const sent = sendResults
    .filter((r): r is PromiseFulfilledResult<{ app: AppDetail; draft: DraftResult; listingId: string | null; sent: boolean }> =>
      r.status === 'fulfilled' && r.value.sent)
    .map(r => r.value);

  console.log(`[play-outreach] sent=${sent.length}/${drafted.length}`);

  // 8. Send summary digest to DIGEST_TO
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const html = buildSummaryHtml(sent, date);

  const { error: sendErr } = await resend.emails.send({
    from:    fromAddr,
    to:      DIGEST_TO,
    subject: `VibeSandbox outreach — ${sent.length} emails sent · ${new Date().toLocaleDateString()}`,
    html,
  });

  if (sendErr) {
    console.error('[play-outreach] digest send failed:', sendErr);
    return NextResponse.json({ error: 'Digest email failed' }, { status: 500 });
  }

  const listingsCreated = sent.filter(s => s.listingId !== null && !existingMap.has(String(s.app.appId ?? ''))).length;

  return NextResponse.json({
    ok: true,
    listed:           listItems.length,
    unseen:           unseen.length,
    targets:          targets.length,
    drafted:          drafted.length,
    sent:             sent.length,
    listings_created: listingsCreated,
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapGenreToCategory(genre: string): string {
  const g = genre.toLowerCase();
  if (g.includes('productivity') || g.includes('tools') || g.includes('business')) return 'Productivity';
  if (g.includes('health') || g.includes('fitness'))  return 'Health';
  if (g.includes('education'))                         return 'Education';
  if (g.includes('finance'))                           return 'Finance';
  if (g.includes('social'))                            return 'Social';
  if (g.includes('lifestyle'))                         return 'Other';
  return 'Other';
}
