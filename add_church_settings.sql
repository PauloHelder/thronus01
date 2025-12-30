-- Add columns for church branding settings
ALTER TABLE churches
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#f97316', -- Default orange-500
ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#1e293b'; -- Default slate-800

-- Create a storage bucket for church logos if it doesn't exist (this usually requires Supabase UI or API, but we can try SQL extension if available, or just assume 'logos' or 'assets' bucket exists. We will use a 'church-assets' bucket)
-- Note: Creating buckets via SQL is not standard in Supabase without extensions, but we can create policies using SQL if the bucket exists. 
-- We'll assume the USER can create the bucket or we use a public one. 
-- Let's try to find an existing bucket. For now, we will focus on the columns.
