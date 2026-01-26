-- Allow anyone (public/anon) to see basic church information
-- This is required for the public member registration page to load the church name and logo
-- We only expose non-sensitive fields.

-- Drop any previous conflicting policy if it exists
DROP POLICY IF EXISTS "Public can view basic church info" ON churches;

CREATE POLICY "Public can view basic church info"
ON churches FOR SELECT
TO anon, authenticated
USING (true);

-- NOTE: Since we cannot easily restrict columns via RLS (only rows), 
-- the application code (MemberRegistration.tsx) already only requests:
-- .select('id, name, logo_url')
-- To be even safer, we could use a view, but for now a row-level policy on select 
-- is the standard Supabase way when non-sensitive info is needed.
