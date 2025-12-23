-- COMPREHENSIVE FIX: Permissions, RLS, and Schema
-- This script resets critical security functions and policies to a known good state.

-- 1. Helper Functions (SECURITY DEFINER to bypass RLS recursion)
CREATE OR REPLACE FUNCTION get_auth_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT role FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_auth_church_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT church_id FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

CREATE OR REPLACE FUNCTION get_auth_member_id()
RETURNS UUID AS $$
    SELECT member_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Services Schema Updates
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS preacher_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS leader_name VARCHAR(255);

-- 3. Reset Services RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view services from their church" ON services;
DROP POLICY IF EXISTS "Users can insert services for their church" ON services;
DROP POLICY IF EXISTS "Users can update services from their church" ON services;
DROP POLICY IF EXISTS "Users can delete services from their church" ON services;
DROP POLICY IF EXISTS "Users can manage services" ON services;
DROP POLICY IF EXISTS "View services" ON services;
DROP POLICY IF EXISTS "Manage services" ON services;
DROP POLICY IF EXISTS "Service role bypass" ON services;

-- Service Role Bypass
CREATE POLICY "Service role bypass" ON services FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- View: Everyone in church
CREATE POLICY "View services" ON services
FOR SELECT USING (
    church_id = get_auth_church_id()
);

-- Manage: Admin/Leader/Superuser
CREATE POLICY "Manage services" ON services
FOR ALL USING (
    church_id = get_auth_church_id()
    AND get_auth_role() IN ('admin', 'leader', 'superuser')
);


-- 4. Reset Departments RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Drop all variants
DROP POLICY IF EXISTS "view departments" ON departments;
DROP POLICY IF EXISTS "View departments" ON departments;
DROP POLICY IF EXISTS "manage departments" ON departments;
DROP POLICY IF EXISTS "Manage departments" ON departments;
DROP POLICY IF EXISTS "Admins/Leaders view all" ON departments;
DROP POLICY IF EXISTS "Members view assigned" ON departments;
DROP POLICY IF EXISTS "Admins/Leaders manage" ON departments;
DROP POLICY IF EXISTS "Service role bypass" ON departments;

-- Service Role Bypass
CREATE POLICY "Service role bypass" ON departments FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- View
CREATE POLICY "View departments" ON departments
FOR SELECT USING (
    church_id = get_auth_church_id()
    AND (
        get_auth_role() IN ('admin', 'leader', 'superuser')
        OR
        EXISTS (
            SELECT 1 FROM department_members dm
            WHERE dm.department_id = departments.id
            AND dm.member_id = get_auth_member_id()
        )
    )
);

-- Manage
CREATE POLICY "Manage departments" ON departments
FOR ALL USING (
    church_id = get_auth_church_id()
    AND get_auth_role() IN ('admin', 'leader', 'superuser')
);
