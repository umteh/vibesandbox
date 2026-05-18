export type PriceType = 'fixed' | 'offer' | 'free';
export type ListingStatus = 'pending' | 'scored' | 'scoring_failed' | 'rejected';
export type ScreenshotStatus = 'pending' | 'captured' | 'failed' | 'auth_required';

export interface ScoreBreakdown {
  problem_clarity:   number;
  ux_quality:        number;
  monetization:      number;
  market_opportunity: number;
  defensibility:     number;
}

export interface Listing {
  id: string;
  userId?: string;
  title: string;
  url: string;
  tagline: string;
  category: string;
  price: number | null;
  priceType: PriceType;
  creator: string;
  avatar: string;
  status: ListingStatus;
  score: number | null;
  breakdown: ScoreBreakdown | null;
  critique: string | null;
  tags: string[];
  createdAt: string;
  screenshotUrl?: string | null;
  screenshotStatus?: ScreenshotStatus;
  listing_metadata?: Record<string, unknown> | null;
  platform?: 'web' | 'ios' | 'android' | 'cross-platform';
}

export const CATEGORIES = ['All', 'Productivity', 'Writing', 'Code', 'Design', 'Research', 'Other'] as const;

export const DIMENSION_LABELS: Record<keyof ScoreBreakdown, string> = {
  problem_clarity:    'Problem',
  ux_quality:         'UX',
  monetization:       'Revenue',
  market_opportunity: 'Market',
  defensibility:      'Moat',
};

export const DIMENSION_WEIGHTS: Record<keyof ScoreBreakdown, number> = {
  problem_clarity:    25,
  ux_quality:         20,
  monetization:       20,
  market_opportunity: 20,
  defensibility:      15,
};

export const LISTINGS: Listing[] = [
  {
    id: '1', title: 'ReplyZen', url: 'replyzen.app',
    tagline: 'AI that drafts replies to your emails in your own voice, trained on 30 days of your history.',
    category: 'Productivity', price: 49, priceType: 'fixed',
    creator: 'Marcus T.', avatar: 'MT',
    status: 'scored', score: 84,
    breakdown: { problem_clarity: 9, ux_quality: 8, monetization: 8, market_opportunity: 7, defensibility: 8 },
    critique: 'ReplyZen nails the persona-matching problem that Gmail Smart Reply fumbles. The onboarding is frictionless — connecting Google takes 30 seconds and the first draft appears before you finish reading the email. AI integration is core: the model genuinely learns your hedging patterns and sign-off style. Loses points on novelty since email-AI is crowded, but execution here is top-tier.',
    tags: ['email', 'productivity', 'voice'],
    createdAt: '2d ago',
  },
  {
    id: '2', title: 'Codeclip', url: 'codeclip.dev',
    tagline: 'Turns any GitHub repo into an interactive explainer. Paste URL, get a walkthrough.',
    category: 'Code', price: 0, priceType: 'free',
    creator: 'Priya S.', avatar: 'PS',
    status: 'scored', score: 76,
    breakdown: { problem_clarity: 8, ux_quality: 7, monetization: 4, market_opportunity: 8, defensibility: 6 },
    critique: "The problem is sharp: most codebases are opaque to outsiders and README files are afterthoughts. Codeclip's AI synthesizes entry points and generates a guided walkthrough that respects file structure. UX is clean though the repo size limit (100MB) is hit without a useful error. Novelty is strong — this angle on codebase comprehension hasn't been productized well.",
    tags: ['github', 'learning', 'open-source'],
    createdAt: '4d ago',
  },
  {
    id: '3', title: 'Moodboard.ai', url: 'moodboard.ai',
    tagline: 'Describe your aesthetic in plain English. Get a moodboard in seconds.',
    category: 'Design', price: null, priceType: 'offer',
    creator: 'Lena K.', avatar: 'LK',
    status: 'scored', score: 61,
    breakdown: { problem_clarity: 6, ux_quality: 7, monetization: 5, market_opportunity: 6, defensibility: 4 },
    critique: "Competent execution of an overcrowded idea. The image curation is decent but indistinguishable from a Pinterest search with a GPT wrapper. AI integration doesn't feel core — swapping the backend for a keyword search would produce similar results. UX is clean but lacks the \"wow\" moment that would make this shareable. Needs a stronger differentiator to stand out in the design tools space.",
    tags: ['design', 'images', 'creative'],
    createdAt: '1w ago',
  },
  {
    id: '4', title: 'DraftPilot', url: 'draftpilot.so',
    tagline: 'Long-form writing companion that argues with your ideas to make them better.',
    category: 'Writing', price: 29, priceType: 'fixed',
    creator: 'James O.', avatar: 'JO',
    status: 'scored', score: 91,
    breakdown: { problem_clarity: 10, ux_quality: 9, monetization: 8, market_opportunity: 8, defensibility: 9 },
    critique: "This is the best writing tool I've seen submitted to date. The \"argue back\" mechanic is genuinely novel — instead of completing your sentences, the AI challenges your premises and asks why. Forces better thinking. The UI is distraction-free and the argument panel is unobtrusive until needed. Problem is crisply stated: writers need resistance, not assistance. Would score higher if the mobile experience weren't an afterthought.",
    tags: ['writing', 'thinking', 'long-form'],
    createdAt: '3d ago',
  },
  {
    id: '5', title: 'PaperMind', url: 'papermind.xyz',
    tagline: 'Chat with any academic paper. Understands citations and jumps to source context.',
    category: 'Research', price: 19, priceType: 'fixed',
    creator: 'Fatima A.', avatar: 'FA',
    status: 'scored', score: 73,
    breakdown: { problem_clarity: 8, ux_quality: 7, monetization: 7, market_opportunity: 7, defensibility: 6 },
    critique: 'Chat-with-PDF is saturated, but PaperMind earns its differentiation through citation awareness — asking "what does this claim cite?" actually pulls the right passage. Useful for researchers. UX is functional but the PDF upload flow has a confusing intermediate state where nothing happens for 8–12 seconds with no spinner. Polish gap there. Novelty score limited by category crowding.',
    tags: ['research', 'pdf', 'academic'],
    createdAt: '5d ago',
  },
  {
    id: '6', title: 'StandupBot', url: 'standup.bot',
    tagline: "Pulls from Jira, GitHub, and Linear. Writes your standup so you don't have to.",
    category: 'Productivity', price: 0, priceType: 'free',
    creator: 'Ravi N.', avatar: 'RN',
    status: 'pending', score: null,
    breakdown: null, critique: null,
    tags: ['standup', 'jira', 'github'],
    createdAt: '12m ago',
    screenshotStatus: 'pending',
  },
  {
    id: '7', title: 'NameSpark', url: 'namespark.io',
    tagline: 'AI that names your product. Domain check, trademark scan, vibe score all in one.',
    category: 'Other', price: 9, priceType: 'fixed',
    creator: 'Chen W.', avatar: 'CW',
    status: 'scored', score: 55,
    breakdown: { problem_clarity: 6, ux_quality: 6, monetization: 7, market_opportunity: 5, defensibility: 4 },
    critique: 'Addresses a real pain (naming is hard) but the AI suggestions feel generic — mostly portmanteaus and dropped vowels. The domain check is the best feature and works reliably. AI feels like decoration over a wordlist. Trademark scan is surface-level and shouldn\'t be positioned as legal guidance. Solid V1 but needs a meaningful leap in suggestion quality to compete.',
    tags: ['naming', 'domains', 'branding'],
    createdAt: '2w ago',
  },
  {
    id: '8', title: 'SlideGeist', url: 'slidegeist.com',
    tagline: "Paste a blog post, get a presentation deck. Slides that don't look AI-made.",
    category: 'Design', price: 39, priceType: 'fixed',
    creator: 'Ola B.', avatar: 'OB',
    status: 'scored', score: 68,
    breakdown: { problem_clarity: 7, ux_quality: 7, monetization: 8, market_opportunity: 8, defensibility: 6 },
    critique: "Solves a real problem: turning content into slides is tedious and existing tools (Beautiful.ai, Tome) feel overbuilt. SlideGeist's layouts are actually tasteful — rare for an AI output. The \"doesn't look AI-made\" claim holds for most outputs. Loses points for limited export options (PDF only, no PowerPoint) and occasional layout breaks on long paragraphs.",
    tags: ['slides', 'presentations', 'content'],
    createdAt: '6d ago',
  },
];

export function scoreColor(score: number) {
  if (score >= 80) return { bg: 'var(--green-light)', text: 'var(--green)', label: 'Excellent' };
  if (score >= 65) return { bg: 'var(--blue-light)', text: 'var(--blue)', label: 'Good' };
  if (score >= 50) return { bg: 'var(--yellow-light)', text: 'var(--yellow)', label: 'Fair' };
  return { bg: 'var(--red-light)', text: 'var(--red)', label: 'Weak' };
}

export function priceDisplay(listing: Pick<Listing, 'price' | 'priceType'>) {
  if (listing.priceType === 'free') return { label: 'Free', sub: null };
  if (listing.priceType === 'offer') return { label: 'Make offer', sub: null };
  return { label: `$${listing.price}`, sub: 'one-time' };
}

export const AVATAR_COLORS: Record<string, string> = {
  MT: 'var(--blue)',
  PS: 'var(--green)',
  LK: 'var(--amber)',
  JO: 'oklch(0.62 0.16 300)',
  FA: 'var(--red)',
  RN: 'oklch(0.55 0.15 180)',
  CW: 'oklch(0.6 0.14 220)',
  OB: 'oklch(0.65 0.15 40)',
};

export const CATEGORY_COLORS: Record<string, [string, string]> = {
  Productivity: ['oklch(0.92 0.05 252)', 'oklch(0.78 0.12 252)'],
  Writing: ['oklch(0.92 0.05 310)', 'oklch(0.78 0.12 310)'],
  Code: ['oklch(0.15 0.02 260)', 'oklch(0.35 0.08 260)'],
  Design: ['oklch(0.92 0.05 30)', 'oklch(0.78 0.12 30)'],
  Research: ['oklch(0.92 0.05 152)', 'oklch(0.78 0.12 152)'],
  Other: ['oklch(0.92 0.05 80)', 'oklch(0.78 0.12 80)'],
};

// Maps a Supabase DB row to the Listing interface used by components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromDbRow(row: Record<string, any>): Listing {
  const priceCents: number | null = row.price_cents ?? null;
  const priceType: PriceType = row.price_type ?? 'fixed';
  const createdAt = row.created_at
    ? new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'recently';

  return {
    id: row.id as string,
    userId: row.user_id as string | undefined,
    title: row.title ?? '',
    url: row.url ?? '',
    tagline: row.description ?? '',
    category: row.category ?? 'Other',
    price: priceType === 'free' ? 0 : priceCents !== null ? priceCents / 100 : null,
    priceType,
    creator: row.creator_name ?? 'Anonymous',
    avatar: row.creator_initials ?? 'AN',
    status: (row.status ?? 'pending') as ListingStatus,
    score: row.score ?? null,
    breakdown: row.score_breakdown_json ?? null,
    critique: row.critique ?? null,
    tags: row.tags ?? [],
    createdAt,
    screenshotUrl: row.screenshot_url ?? null,
    screenshotStatus: (row.screenshot_status ?? 'pending') as ScreenshotStatus,
    listing_metadata: row.listing_metadata ?? null,
    platform: (row.platform ?? 'web') as 'web' | 'ios' | 'android' | 'cross-platform',
  };
}
