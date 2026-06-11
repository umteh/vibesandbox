-- Phase 1: Zillow "not for sale now" model
-- Run in Supabase SQL editor before deploying the feature branch

-- T1: Schema changes to listings table
-- status is a Postgres enum type (listing_status) — add the new value first
ALTER TYPE listing_status ADD VALUE IF NOT EXISTS 'not_for_sale';

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS source_app_id TEXT;

-- New auto-created listings default to 'not_for_sale'
ALTER TABLE listings
  ALTER COLUMN status SET DEFAULT 'not_for_sale';

-- T2: RLS policies for unclaimed (not_for_sale) listings
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'listings' AND policyname = 'public_read_not_for_sale'
  ) THEN
    EXECUTE 'CREATE POLICY "public_read_not_for_sale" ON listings FOR SELECT USING (status = ''not_for_sale'')';
  END IF;
END $$;

-- Allow service_role (used by opt-out route + cron) to delete any listing
-- (existing service_role bypass should already cover this, but make explicit)
-- NOTE: Supabase service_role bypasses RLS by default; this is for documentation.

-- T3: Allow null user_id for auto-created (not_for_sale) listings
ALTER TABLE listings ALTER COLUMN user_id DROP NOT NULL;

-- T4: Outreach tracking table
CREATE TABLE IF NOT EXISTS outreach_targets (
  id               BIGSERIAL PRIMARY KEY,
  source           TEXT NOT NULL DEFAULT 'google_play',
  app_id           TEXT NOT NULL,
  app_name         TEXT,
  developer_email  TEXT,
  developer        TEXT,
  installs         TEXT,
  score            NUMERIC,
  drafted_message  TEXT,
  status           TEXT NOT NULL DEFAULT 'sent',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source, app_id)
);

-- After applying: verify with
-- SELECT id, title, status, source_app_id FROM listings WHERE status = 'not_for_sale' LIMIT 5;
-- SELECT source, app_id, app_name, status FROM outreach_targets LIMIT 10;
