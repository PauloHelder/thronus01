-- Add detailed columns to members table

ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS occupation text,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS join_date date DEFAULT CURRENT_DATE;
