-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enums ────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE listing_status AS ENUM ('pending', 'scored', 'scoring_failed', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE screenshot_status AS ENUM ('pending', 'captured', 'failed', 'auth_required');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE price_type AS ENUM ('fixed', 'offer', 'free');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Profiles ─────────────────────────────────────────────────────────────────
-- Extends auth.users. email_encrypted is AES-256-GCM at app level.
CREATE TABLE IF NOT EXISTS public.profiles (
  id             UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name   TEXT,
  email_encrypted TEXT NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ─── Listings ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.listings (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  creator_name         TEXT NOT NULL DEFAULT '',
  creator_initials     TEXT NOT NULL DEFAULT '',
  title                TEXT NOT NULL,
  url                  TEXT NOT NULL,
  description          TEXT NOT NULL,
  category             TEXT NOT NULL,
  price_cents          INTEGER,
  price_type           price_type NOT NULL DEFAULT 'fixed',
  screenshot_url       TEXT,
  screenshot_status    screenshot_status NOT NULL DEFAULT 'pending',
  score                INTEGER CHECK (score >= 0 AND score <= 100),
  score_breakdown_json JSONB,
  critique             TEXT,
  score_version        INTEGER NOT NULL DEFAULT 0,
  last_rescored_at     TIMESTAMPTZ,
  status               listing_status NOT NULL DEFAULT 'pending',
  tags                 TEXT[] DEFAULT '{}',
  created_at           TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at           TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_listings_score    ON public.listings (score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_listings_category ON public.listings (category);
CREATE INDEX IF NOT EXISTS idx_listings_status   ON public.listings (status);
CREATE INDEX IF NOT EXISTS idx_listings_created  ON public.listings (created_at DESC);

-- auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS listings_updated_at ON public.listings;
CREATE TRIGGER listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Relay tokens ─────────────────────────────────────────────────────────────
-- buyer_email_hash: SHA-256(buyer_email + listing_id) for idempotency
-- buyer_email_encrypted: AES-256-GCM at app level
CREATE TABLE IF NOT EXISTS public.relay_tokens (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id           UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  buyer_email_hash     TEXT NOT NULL,
  buyer_email_encrypted TEXT NOT NULL,
  buyer_name           TEXT NOT NULL,
  buyer_message        TEXT NOT NULL,
  forwarded_at         TIMESTAMPTZ,
  forward_status       TEXT NOT NULL DEFAULT 'pending', -- pending | sent | failed
  expires_at           TIMESTAMPTZ NOT NULL,
  created_at           TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Unique constraint for idempotency: one token per buyer+listing pair
CREATE UNIQUE INDEX IF NOT EXISTS idx_relay_idempotency
  ON public.relay_tokens (listing_id, buyer_email_hash);

-- ─── Submission log ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.submission_log (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  listing_id  UUID REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_submission_log_user_time
  ON public.submission_log (user_id, created_at DESC);

-- ─── Row-Level Security ───────────────────────────────────────────────────────
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relay_tokens  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_log ENABLE ROW LEVEL SECURITY;

-- profiles: own row only
CREATE POLICY "profiles_select_own"  ON public.profiles FOR SELECT  USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own"  ON public.profiles FOR INSERT  WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own"  ON public.profiles FOR UPDATE  USING (auth.uid() = id);

-- listings: public read, authenticated write own
CREATE POLICY "listings_public_read"   ON public.listings FOR SELECT  USING (true);
CREATE POLICY "listings_insert_auth"   ON public.listings FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "listings_update_own"    ON public.listings FOR UPDATE  USING (auth.uid() = user_id);

-- relay_tokens: no client access (service role only)
CREATE POLICY "relay_deny_all"        ON public.relay_tokens USING (false);

-- submission_log: own rows only
CREATE POLICY "submission_log_select" ON public.submission_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "submission_log_insert" ON public.submission_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── Realtime ─────────────────────────────────────────────────────────────────
-- Run in Supabase dashboard: Table Editor > listings > Enable Realtime
-- Or via CLI: supabase db push then enable in dashboard.
-- The SQL below works if the publication doesn't yet restrict tables:
ALTER TABLE public.listings REPLICA IDENTITY FULL;
-- Add to the default supabase_realtime publication (idempotent):
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'listings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.listings;
  END IF;
END $$;
