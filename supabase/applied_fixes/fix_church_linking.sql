-- Enable reading all churches for authenticated users (required to find parent church by code)
DROP POLICY IF EXISTS "Authenticated users can view churches" ON public.churches;
CREATE POLICY "Authenticated users can view churches" ON public.churches
FOR SELECT
TO authenticated
USING (true);

-- Ensure admins can update their OWN church settings (required for linking)
DROP POLICY IF EXISTS "Admins can update their own church" ON public.churches;
CREATE POLICY "Admins can update their own church" ON public.churches
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.church_id = churches.id
    AND users.role IN ('admin', 'pastor', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.church_id = churches.id
    AND users.role IN ('admin', 'pastor', 'super_admin')
  )
);
