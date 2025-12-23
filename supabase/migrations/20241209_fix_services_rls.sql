-- Fix Services RLS to use robust SECURITY DEFINER functions
-- and restrict write access to Admins/Leaders/Superusers.

-- (Re-using get_auth_church_id and get_auth_role defined in 20241209_fix_rls_recursion.sql)

-- 1. Drop existing policies
DROP POLICY IF EXISTS "Users can view services from their church" ON services;
DROP POLICY IF EXISTS "Users can insert services for their church" ON services;
DROP POLICY IF EXISTS "Users can update services from their church" ON services;
DROP POLICY IF EXISTS "Users can delete services from their church" ON services;
DROP POLICY IF EXISTS "Users can manage services" ON services;
DROP POLICY IF EXISTS "Service role bypass" ON services;

-- 2. Create new robust policies

-- Service Role Bypass
CREATE POLICY "Service role bypass" ON services FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- View (SELECT): Everyone in the church can view services
CREATE POLICY "View services" ON services
FOR SELECT USING (
    church_id = get_auth_church_id()
);

-- Manage (INSERT, UPDATE, DELETE): Only Admin/Leader/Superuser
CREATE POLICY "Manage services" ON services
FOR ALL USING (
    church_id = get_auth_church_id()
    AND get_auth_role() IN ('admin', 'leader', 'superuser')
);
