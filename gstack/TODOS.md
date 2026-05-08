# TODOS — VibeSandbox AI App Marketplace

## Shipped ✓

- Full Next.js 14 App Router frontend (feed, listing detail, how-it-works)
- Supabase backend — listings, profiles, relay_tokens, submission_log tables
- Gemini 2.5 Flash AI scoring (5-dimension rubric, screenshot via microlink.io)
- Encrypted email relay (AES-256-GCM, idempotency, 24h TTL, 410 on expiry)
- Rate limiting: 3 submissions / 7 days (admin bypass via ADMIN_EMAILS env var)
- HMAC-SHA256 score callback authentication + replay protection
- Supabase Realtime — score badges update live without page refresh
- Screenshot auto-capture via microlink.io → Supabase Storage
- Manual screenshot upload (for auth-required URLs)
- Mobile app support (iOS / Android / Cross-platform) with phone frame placeholder
- Pitch & Due Diligence section (hook, secret sauce, MAU/MRR, tech stack tags, burn, maintenance, assets, freeform notes)
- Pitch Strength meter (real-time scoring as seller types)
- Listing owner: edit title/URL/description/category/price inline on detail page
- Listing owner: delete with confirm modal
- Display name change in nav dropdown
- How It Works page at /how-it-works
- BAUD-inspired aesthetic: cream bg, ink borders, flat offset shadows, neon accent buttons
- Monospace font stack (system ui-monospace)

---

## V2 Features

### Moderation queue
**What:** Founder-only dashboard to review and remove listings. List, delete, ban-account.
**Why:** V1 auto-approves all submissions. Manual takedown via Supabase Studio is the only recovery today.
**Where to start:** `/app/admin/listings` page, guarded by `role: admin` in Supabase RLS.

---

### Screenshot retry on failure
**What:** Retry microlink.io capture once after 30s before marking `screenshot_status: failed`.
**Why:** SPAs and heavy pages often fail on first cold load but succeed on retry.
**Where to start:** `app/api/score-listing/route.ts` — wrap the microlink fetch in a retry loop.

---

### Resend email relay (production)
**What:** `RESEND_API_KEY` is still a placeholder. Wire up a verified sending domain.
**Why:** Contact form currently logs "skipping send in dev" — no emails reach sellers.
**Where to start:** Add a real key + verified domain in `.env.local` and Vercel env vars.

---

### Vercel deployment
**What:** Deploy to Vercel with all env vars set.
**Required env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `EMAIL_ENCRYPTION_KEY`, `SCORER_HMAC_SECRET`, `INTERNAL_SECRET`, `GOOGLE_AI_API_KEY`, `RESEND_API_KEY`, `RESEND_FROM_DOMAIN`, `NEXT_PUBLIC_SITE_URL`, `ADMIN_EMAILS`
**Where to start:** `vercel --prod` from ~/vibesandbox after setting env vars in Vercel dashboard.

---

### Re-score request
**What:** Let sellers request a re-score after updating description or screenshot.
**Why:** Scoring failed listings and sellers who improve their listing have no recovery path.
**Where to start:** Button on detail page (owner only) → `POST /api/listings/{id}/rescore` → fires score-listing job.
