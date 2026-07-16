-- Migration: Add Teenager Statistics to Services Table
-- Date: 2026-07-15

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS stats_teenagers_boys INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stats_teenagers_girls INTEGER DEFAULT 0;

-- Force reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
