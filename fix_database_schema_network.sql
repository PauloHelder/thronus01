-- 1. Add the missing parent_id column
ALTER TABLE public.churches 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.churches(id);

-- 2. Add an index for performance queries on branches
CREATE INDEX IF NOT EXISTS idx_churches_parent_id ON public.churches(parent_id);

-- 3. Re-apply the RLS policy for viewing branches (it might have failed before due to missing column)
DROP POLICY IF EXISTS "View branch churches" ON public.churches;
CREATE POLICY "View branch churches" ON public.churches
FOR SELECT
TO authenticated
USING (
   parent_id IN (
     SELECT church_id 
     FROM public.users 
     WHERE id = auth.uid()
   )
);

-- 4. Enable searching churches by slug (for adding branches)
DROP POLICY IF EXISTS "Search churches by slug" ON public.churches;
CREATE POLICY "Search churches by slug" ON public.churches
FOR SELECT
TO authenticated
USING (
   slug IS NOT NULL
);
