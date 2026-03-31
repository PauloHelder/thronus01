-- Migration: Adding detailed new converts breakdown to services table
-- First, remove any previous column if it exists to ensure a clean state
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'stats_new_converts') THEN
        ALTER TABLE public.services DROP COLUMN stats_new_converts;
    END IF;
END $$;

ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS stats_new_converts_men INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stats_new_converts_women INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stats_new_converts_children INTEGER DEFAULT 0;

COMMENT ON COLUMN public.services.stats_new_converts_men IS 'Número de novos convertidos (homens)';
COMMENT ON COLUMN public.services.stats_new_converts_women IS 'Número de novos convertidos (mulheres)';
COMMENT ON COLUMN public.services.stats_new_converts_children IS 'Número de novos convertidos (crianças)';
