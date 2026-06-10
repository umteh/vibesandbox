-- Phase 1: Zillow "not for sale now" model
-- Run in Supabase SQL editor before deploying the feature branch

-- T1: Schema changes to listings table
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS source_app_id TEXT;

-- status column: existing rows keep their current status values
-- New auto-created listings default to 'not_for_sale'
ALTER TABLE listings
  ALTER COLUMN status SET DEFAULT 'not_for_sale';

-- T2: RLS policies for unclaimed (not_for_sale) listings
-- Unclaimed listings have user_id = NULL and must be publicly readable

-- Allow anyone to read not_for_sale listings (unclaimed)
CREATE POLICY IF NOT EXISTS "public_read_not_for_sale"
  ON listings
  FOR SELECT
  USING (status = 'not_for_sale');

-- Allow service_role (used by opt-out route + cron) to delete any listing
-- (existing service_role bypass should already cover this, but make explicit)
-- NOTE: Supabase service_role bypasses RLS by default; this is for documentation.

-- After applying: verify with
-- SELECT id, title, status, source_app_id FROM listings WHERE status = 'not_for_sale' LIMIT 5;
