# VibeSandbox — CLAUDE.md

AI-powered app marketplace. Builders list apps, AI scores them across 5 buyer-relevant dimensions, buyers discover and contact sellers directly. No payment processing (Craigslist model).

**Production:** https://vibesandbox.store  
**Stack:** Next.js 14 (App Router), Supabase, Gemini 2.5 Flash, Resend

---

## Project Structure

```
app/
  feed/               # Main feed page (SSR listings)
  listings/[id]/      # Listing detail page
  how-it-works/       # Public explainer page
  deal-guide/         # Buyer/seller deal guide
  auth/               # Auth callback
  api/
    listings/         # CRUD + PATCH (incl. listing_metadata)
    listings/[id]/    # Single listing GET/PATCH/DELETE
    score-listing/    # Gemini scoring (enriched with store data)
    capture-screenshot/ # microlink.io screenshot capture
    contact/          # Encrypted email relay (Resend)
    upload/screenshot # Screenshot upload to Supabase Storage
    profile/          # Display name update

components/
  FeedClient.tsx      # Main feed UI (filters, sort, cards grid)
  Nav.tsx             # Sticky nav with search
  ListingCard.tsx     # Card with breakdown bars + entrance animation
  SubmitModal.tsx     # 3-step submit form (URL-first, platform auto-detect)
  ListingOwnerActions.tsx  # Edit + delete (incl. Pitch & Due Diligence)
  ScoreBadge.tsx      # Score display with pop animation
  DimBar.tsx          # Horizontal score bar (detail page)
  AppScreenPlaceholder.tsx # Screenshot or placeholder (no phone frame)
  PitchSection.tsx    # Hook, AI secret sauce, MAU/MRR
  DueDiligenceSection.tsx  # Tech stack, burn, maintenance, assets
  AuthModal.tsx       # Sign in / sign up (Supabase)

lib/
  data.ts             # Types, CATEGORIES, DIMENSION_LABELS, DIMENSIONS_ORDERED, seed data
  fetch-app-data.ts   # Per-platform data fetching before scoring
  metadata.ts         # ListingMetadata type (pitch + due diligence)
```

---

## Key Design Decisions

**Scoring dimensions (v2 — buyer-relevant):**
```
problem_clarity    25%   Who suffers and why — one sentence
ux_quality         20%   Clear in 10s, zero friction to try
monetization       20%   Clear revenue model, visible pricing
market_opportunity 20%   Large or growing market, room to capture share
defensibility      15%   Proprietary data, switching costs, unique distribution
```
Old dimensions (`ai_integration`, `polish`, `novelty`) exist in `DIMENSION_LABELS` as legacy keys so DB rows scored before v2 still render. `DIMENSIONS_ORDERED` controls render order — always use this array, never `Object.entries(breakdown)`.

**Data enrichment before scoring:**
- iOS → iTunes Lookup API (description, rating, review count, price, category)
- Android → `google-play-scraper` (installs, top reviews, rating)
- Web → microlink metadata (title, OG tags, meta description)

**Platform auto-detection in submit form:**
- `apps.apple.com` → ios
- `play.google.com` → android
- Any other URL → web
- Manual override always available

**Screenshot service:** microlink.io (free tier, 50 req/day). Stored in Supabase Storage `screenshots` bucket.

**Email relay:** Resend. Buyer messages forwarded once to seller email. Token expires 24h. No conversations stored.

**Internal API calls:** Protected by `INTERNAL_SECRET` header. Score-listing uses `NEXT_PUBLIC_SITE_URL ?? VERCEL_URL ?? localhost:3000` so it works on preview deployments too.

---

## Categories

`All, Productivity, Writing, Code, Design, Research, Health, Education, Finance, Marketing, Social, Other`

Each has a color pair in `CATEGORY_COLORS` (lib/data.ts) used for card placeholders.

---

## Design System

- **Font:** DM Mono (loaded via `next/font/google`) — monospace throughout
- **Background:** Warm cream `oklch(0.96 0.022 82)` with subtle dot-grid in hero
- **Style:** Neo-brutalist — hard 2px ink borders, offset box-shadows, no border-radius on interactive elements
- **Accent:** Lime green `oklch(0.88 0.19 128)`
- **Colors:** OKLCH color space, defined as CSS variables in `app/globals.css`
- **Animations:** `floatY` (robot), `cardEnter` (stagger by index), `barFill` (breakdown bars), `pop` (score badge), `fadeUp` (hero sections)
- **Touch targets:** Filter buttons min 32px, nav buttons 31–37px

---

## Environment Variables

```
NEXT_PUBLIC_SITE_URL          # https://vibesandbox.store (production)
NEXT_PUBLIC_SUPABASE_URL      # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY # Supabase anon key (browser-safe)
SUPABASE_SERVICE_ROLE_KEY     # Supabase service role (server only)
GOOGLE_AI_API_KEY             # Gemini 2.5 Flash
INTERNAL_SECRET               # Shared secret for internal API calls
RESEND_API_KEY                # Email relay
```

`VERCEL_URL` is set automatically by Vercel — no manual config needed.

---

## Pages

| Route | Description |
|---|---|
| `/` | Redirects to `/feed` |
| `/feed` | Main marketplace feed |
| `/listings/[id]` | Listing detail with AI critique and score breakdown |
| `/how-it-works` | Explainer: 4 steps, scoring rubric with tier details, calibration examples, FAQ |
| `/deal-guide` | Buyer/seller guide: 6-step process, seller checklist, buyer Q1–Q8, red flags |

---

## Skill Routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
