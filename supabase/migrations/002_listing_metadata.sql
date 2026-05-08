ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS listing_metadata JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS platform TEXT NOT NULL DEFAULT 'web';
