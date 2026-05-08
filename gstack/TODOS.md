# TODOS — AI App Marketplace

## V2 Features

### Playwright screenshot retry on failure
**What:** When Playwright fails to capture a screenshot, retry once after 30 seconds before marking `screenshot_status: failed`.
**Why:** Many SPAs are slow on first load but succeed on retry. A permanent failure on first attempt leaves listings stuck in failed state unnecessarily.
**Pros:** Better listing quality at launch. Catches transient failures.
**Cons:** Adds latency to scoring. Slightly more complex worker code.
**Where to start:** `fly-worker/src/scorer.ts` — wrap Playwright capture in try/retry with 30s sleep.
**Depends on:** Playwright eval pipeline shipped.

---

### Moderation queue
**What:** Founder-only dashboard to review and remove listings before they accumulate visibility. List, delete, and ban-account actions.
**Why:** V1 auto-approves all submissions. A scam or NSFW listing that scores well goes live with no gate. Only recovery today is Supabase Studio delete. A bad first listing tanks credibility permanently.
**Pros:** Prevents reputation damage. Especially important for NSFW (builder-on-laptop audience).
**Cons:** Founder review bottleneck. ~3 hours to build.
**Where to start:** `/app/admin/listings` page, guarded by `role: admin` check in Supabase RLS.
**Depends on:** Auth (Step 6) and listings table shipped.
