-- FORCE FIX: Admin Visibility for Departments
-- This script ensures the user has the correct role and refines RLS to be bulletproof.

-- 1. UTILITY FUNCTIONS (Reliable SECURITY DEFINER)
CREATE OR REPLACE FUNCTION get_auth_church_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT church_id FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_auth_member_id()
RETURNS UUID AS $$
    SELECT member_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role IN ('admin', 'superuser')
        FROM users
        WHERE id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. SPECIFIC USER FIX (Ensure your user is definitely an admin)
UPDATE users 
SET role = 'admin' 
WHERE email = 'mvidaegraca21@gmail.com';

-- 3. DEPARTMENTS RLS (Using SECURITY DEFINER functions)
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Drop verify potential old policies
DROP POLICY IF EXISTS "Admins view all" ON departments;
DROP POLICY IF EXISTS "Members and Leaders view assigned" ON departments;
DROP POLICY IF EXISTS "Admins/Leaders view all" ON departments;
DROP POLICY IF EXISTS "Members view assigned" ON departments;
DROP POLICY IF EXISTS "Anyone view departments" ON departments;
DROP POLICY IF EXISTS "Admins manage all" ON departments;
DROP POLICY IF EXISTS "Leaders manage assigned" ON departments;

-- VIEW: Admins (Uses helper to avoid RLS recursion/blocking)
CREATE POLICY "Admins view all" ON departments
FOR SELECT USING (
    is_admin() 
    AND 
    church_id = get_auth_church_id()
);

-- VIEW: Members & Leaders (Assigned only)
CREATE POLICY "Members and Leaders view assigned" ON departments
FOR SELECT USING (
    church_id = get_auth_church_id()
    AND EXISTS (
        SELECT 1 FROM department_members dm
        WHERE dm.department_id = departments.id
        AND dm.member_id = get_auth_member_id()
    )
);

-- MANAGE: Admins
CREATE POLICY "Admins manage all" ON departments
FOR ALL USING (
    is_admin() 
    AND 
    church_id = get_auth_church_id()
);

-- MANAGE: Leaders (Assigned only)
CREATE POLICY "Leaders manage assigned" ON departments
FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'leader'
    AND
    church_id = get_auth_church_id()
    AND EXISTS (
        SELECT 1 FROM department_members dm
        WHERE dm.department_id = departments.id
        AND dm.member_id = get_auth_member_id()
    )
);

-- 4. DEPARTMENT MEMBERS RLS (Fix Visibility of counts)
ALTER TABLE department_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view all members" ON department_members;
DROP POLICY IF EXISTS "Admins manage members" ON department_members;

CREATE POLICY "Admins view all members" ON department_members
FOR SELECT USING (
    is_admin()
    AND EXISTS (
        SELECT 1 FROM departments d
        WHERE d.id = department_members.department_id
        AND d.church_id = get_auth_church_id()
    )
);

CREATE POLICY "Admins manage members" ON department_members
FOR ALL USING (
    is_admin()
    AND EXISTS (
        SELECT 1 FROM departments d
        WHERE d.id = department_members.department_id
        AND d.church_id = get_auth_church_id()
    )
);
