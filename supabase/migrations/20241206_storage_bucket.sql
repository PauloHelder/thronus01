-- Create storage bucket for event covers
INSERT INTO storage.buckets (id, name, public) 
VALUES ('event-covers', 'event-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies to avoid conflicts (Idempotency)
DROP POLICY IF EXISTS "Public Access to Event Covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload event covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own uploads or admins" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own uploads or admins" ON storage.objects;

-- Policy to allow public access to view covers
CREATE POLICY "Public Access to Event Covers"
ON storage.objects FOR SELECT
USING ( bucket_id = 'event-covers' );

-- Policy to allow authenticated users (leaders/admins) to upload covers
CREATE POLICY "Authenticated users can upload event covers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-covers' 
  AND auth.role() = 'authenticated'
  AND (
    (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) IN ('admin', 'leader')
    OR
    (SELECT permissions FROM public.users WHERE id = auth.uid() LIMIT 1) @> '"manage_events"'
  )
);

-- Policy to allow owners to update/delete (or admins)
CREATE POLICY "Users can update their own uploads or admins"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'event-covers'
  AND (
    owner = auth.uid() 
    OR 
    (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin'
  )
);

CREATE POLICY "Users can delete their own uploads or admins"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'event-covers'
  AND (
    owner = auth.uid() 
    OR 
    (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin'
  )
);
