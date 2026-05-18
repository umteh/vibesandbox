/**
 * Fetches enriched app data per platform before AI scoring.
 * Web   → microlink metadata
 * iOS   → iTunes Lookup API (free, no key required)
 * Android → google-play-scraper
 */

export interface AppData {
  platform: string;
  // Common
  title?: string;
  description?: string;
  // Store metadata
  rating?: number;          // 0–5
  ratingCount?: number;
  price?: string;           // "$0.99", "Free", etc.
  category?: string;
  developer?: string;
  installs?: string;        // Android: "1,000,000+"
  topReviews?: string[];    // up to 5 review texts
  // Web metadata
  metaDescription?: string;
  ogTitle?: string;
  author?: string;
  // Raw for prompt
  summary: string;          // pre-formatted block fed into Gemini
}

// ─── iOS ─────────────────────────────────────────────────────────────────────

function extractAppStoreId(url: string): string | null {
  const m = url.match(/\/id(\d+)/);
  return m ? m[1] : null;
}

async function fetchIosData(url: string): Promise<AppData> {
  const id = extractAppStoreId(url);
  if (!id) return { platform: 'ios', summary: '(could not extract App Store ID)' };

  try {
    const res = await fetch(
      `https://itunes.apple.com/lookup?id=${id}&entity=software`,
      { signal: AbortSignal.timeout(8_000) }
    );
    if (!res.ok) throw new Error(`iTunes API ${res.status}`);
    const json = await res.json() as { results?: Record<string, unknown>[] };
    const app = json.results?.[0];
    if (!app) return { platform: 'ios', summary: '(App Store app not found)' };

    const title       = String(app.trackName ?? '');
    const description = String(app.description ?? '').slice(0, 1200);
    const rating      = Number(app.averageUserRating ?? 0);
    const ratingCount = Number(app.userRatingCount ?? 0);
    const price       = app.formattedPrice ? String(app.formattedPrice) : (Number(app.price) === 0 ? 'Free' : `$${app.price}`);
    const category    = String(app.primaryGenreName ?? '');
    const developer   = String(app.sellerName ?? '');

    const summary = [
      `Platform: iOS App Store`,
      `Title: ${title}`,
      `Developer: ${developer}`,
      `Category: ${category}`,
      `Price: ${price}`,
      `Rating: ${rating.toFixed(1)}/5 (${ratingCount.toLocaleString()} ratings)`,
      `Description:\n${description}`,
    ].join('\n');

    return { platform: 'ios', title, description, rating, ratingCount, price, category, developer, summary };
  } catch (err) {
    return { platform: 'ios', summary: `(iTunes API error: ${err})` };
  }
}

// ─── Android ─────────────────────────────────────────────────────────────────

function extractPlayStoreId(url: string): string | null {
  const m = url.match(/[?&]id=([^&]+)/);
  return m ? m[1] : null;
}

async function fetchAndroidData(url: string): Promise<AppData> {
  const appId = extractPlayStoreId(url);
  if (!appId) return { platform: 'android', summary: '(could not extract Play Store package ID)' };

  try {
    // Dynamic import — google-play-scraper is CJS
    const gp = (await import('google-play-scraper')).default;

    const [app, reviewsResult] = await Promise.allSettled([
      gp.app({ appId, throttle: 10 }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      gp.reviews({ appId, num: 5, sort: (gp.sort as any).HELPFULNESS ?? 1, throttle: 10 }),
    ]);

    if (app.status === 'rejected') {
      return { platform: 'android', summary: `(Play Store fetch error: ${app.reason})` };
    }

    const a = app.value as unknown as Record<string, unknown>;
    const title       = String(a.title ?? '');
    const description = String(a.description ?? '').slice(0, 1200);
    const rating      = Number(a.score ?? 0);
    const ratingCount = Number(a.ratings ?? 0);
    const price       = a.free ? 'Free' : `$${a.price}`;
    const category    = String(a.genre ?? '');
    const developer   = String(a.developer ?? '');
    const installs    = String(a.installs ?? '');

    const topReviews: string[] = [];
    if (reviewsResult.status === 'fulfilled') {
      const data = reviewsResult.value as unknown as { data?: { text?: string }[] };
      (data.data ?? []).slice(0, 5).forEach(r => {
        if (r.text) topReviews.push(`"${r.text.slice(0, 200)}"`);
      });
    }

    const summary = [
      `Platform: Google Play Store`,
      `Title: ${title}`,
      `Developer: ${developer}`,
      `Category: ${category}`,
      `Price: ${price}`,
      `Installs: ${installs}`,
      `Rating: ${rating.toFixed(1)}/5 (${ratingCount.toLocaleString()} ratings)`,
      `Description:\n${description}`,
      topReviews.length ? `\nTop reviews:\n${topReviews.join('\n')}` : '',
    ].filter(Boolean).join('\n');

    return { platform: 'android', title, description, rating, ratingCount, price, category, developer, installs, topReviews, summary };
  } catch (err) {
    return { platform: 'android', summary: `(Play Store fetch error: ${err})` };
  }
}

// ─── Web ─────────────────────────────────────────────────────────────────────

async function fetchWebData(url: string): Promise<AppData> {
  try {
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    const res = await fetch(
      `https://api.microlink.io/?url=${encodeURIComponent(fullUrl)}&meta=true&video=false`,
      { signal: AbortSignal.timeout(10_000), headers: { 'User-Agent': 'VibeSandbox/1.0' } }
    );
    if (!res.ok) throw new Error(`microlink ${res.status}`);
    const json = await res.json() as { data?: Record<string, unknown> };
    const d = json.data ?? {};

    const title          = String(d.title ?? '');
    const metaDescription = String(d.description ?? '').slice(0, 600);
    const ogTitle        = String((d.og as Record<string, unknown>)?.title ?? title);
    const author         = String(d.author ?? d.publisher ?? '');
    const lang           = String(d.lang ?? '');

    const summary = [
      `Platform: Web app`,
      title          ? `Title: ${title}` : '',
      author         ? `Publisher: ${author}` : '',
      lang           ? `Language: ${lang}` : '',
      metaDescription ? `Meta description: ${metaDescription}` : '',
      ogTitle && ogTitle !== title ? `OG title: ${ogTitle}` : '',
    ].filter(Boolean).join('\n');

    return { platform: 'web', title, metaDescription, ogTitle, author, summary };
  } catch (err) {
    return { platform: 'web', summary: `(metadata fetch error: ${err})` };
  }
}

// ─── Router ──────────────────────────────────────────────────────────────────

export async function fetchAppData(url: string, platform: string): Promise<AppData> {
  const normalised = url.toLowerCase();

  if (platform === 'ios' || normalised.includes('apps.apple.com') || normalised.includes('testflight.apple.com')) {
    return fetchIosData(url);
  }
  if (platform === 'android' || normalised.includes('play.google.com')) {
    return fetchAndroidData(url);
  }
  if (platform === 'cross-platform') {
    // Try both stores; use whichever returns data
    const [ios, android] = await Promise.allSettled([fetchIosData(url), fetchAndroidData(url)]);
    const iosData     = ios.status === 'fulfilled' ? ios.value : null;
    const androidData = android.status === 'fulfilled' ? android.value : null;
    const best        = (iosData?.rating ?? 0) >= (androidData?.rating ?? 0) ? iosData : androidData;
    return best ?? { platform: 'cross-platform', summary: '(no store data found)' };
  }

  return fetchWebData(url);
}
