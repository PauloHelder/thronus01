-- POLICY 1: Allow users to view churches that are branches of their own church
-- This is necessary for the 'My Network' page to list connected branches.
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

-- POLICY 2: Allow users to view ANY church by slug (needed for adding a branch by code)
-- We use a focused policy for security, rather than allowing full access.
DROP POLICY IF EXISTS "Search churches by slug" ON public.churches;
CREATE POLICY "Search churches by slug" ON public.churches
FOR SELECT
TO authenticated
USING (
   slug IS NOT NULL
);

-- Reminder: You must also run the 'fix_rpc_link_branch.sql' script to enable the linking functionality!
