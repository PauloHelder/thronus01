-- Add branding columns to churches table
-- Resolves error 'column churches.primary_color does not exist'

ALTER TABLE public.churches 
ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#f97316',
ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#1e293b',
ADD COLUMN IF NOT EXISTS logo_url text;
