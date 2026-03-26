-- Allow Super Admins (role = 'superuser' or 'admin' with blanket access) to view counts in these tables
-- We assume the check is logic based on the 'users' table or a claim.
-- Since Supabase auth logic can be complex, valid strategy is:
-- IF user is superuser, return true.

-- Helper function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
DECLARE
  current_role text;
BEGIN
  SELECT role INTO current_role FROM public.users WHERE id = auth.uid();
  RETURN current_role = 'superuser' OR current_role = 'admin'; -- Adjust if 'admin' is just local church admin. Usually 'superuser'.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Members
CREATE POLICY "Super Admins can view all members"
ON members FOR SELECT
USING ( is_super_admin() );

-- 2. Groups
CREATE POLICY "Super Admins can view all groups"
ON groups FOR SELECT
USING ( is_super_admin() );

-- 3. Departments
CREATE POLICY "Super Admins can view all departments"
ON departments FOR SELECT
USING ( is_super_admin() );

-- 4. Teaching Classes
CREATE POLICY "Super Admins can view all teaching classes"
ON teaching_classes FOR SELECT
USING ( is_super_admin() );

-- 5. Discipleship Leaders
CREATE POLICY "Super Admins can view all discipleship data"
ON discipleship_leaders FOR SELECT
USING ( is_super_admin() );

-- 6. Users (Public)
CREATE POLICY "Super Admins can view all users"
ON users FOR SELECT
USING ( is_super_admin() );

-- Note: If policies already exist, this might fail or duplicate. 
-- Ideally we drop generic policies or ensure these specific ones are additive (Postgres policies are OR'd together).
-- If there is a restrictive policy that doesn't include OR is_super_admin(), these new policies will OPEN access because (Condition A) OR (Condition B).
