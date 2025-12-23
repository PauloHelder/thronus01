-- Fix RLS Recursion by using SECURITY DEFINER functions for all auth checks
-- This prevents the policy from trying to query the 'users' table with restricted access
-- which can cause the policy to evaluate to false or error out silently.

-- 1. Create robust helper functions
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

-- 2. Drop existing policies (Clean slate for Departments)
DROP POLICY IF EXISTS "Admins/Leaders view all" ON departments;
DROP POLICY IF EXISTS "Members view assigned" ON departments;
DROP POLICY IF EXISTS "Admins/Leaders manage" ON departments;
DROP POLICY IF EXISTS "Service role bypass" ON departments;

DROP POLICY IF EXISTS "Admins/Leaders view all members" ON department_members;
DROP POLICY IF EXISTS "Members view assigned members" ON department_members;
DROP POLICY IF EXISTS "Admins/Leaders manage members" ON department_members;
DROP POLICY IF EXISTS "Service role bypass" ON department_members;

DROP POLICY IF EXISTS "Admins/Leaders view all schedules" ON department_schedules;
DROP POLICY IF EXISTS "Members view assigned schedules" ON department_schedules;
DROP POLICY IF EXISTS "Admins/Leaders manage schedules" ON department_schedules;
DROP POLICY IF EXISTS "Service role bypass" ON department_schedules;

-- 3. Apply simplified, robust policies using helper functions

-- === DEPARTMENTS ===
CREATE POLICY "Service role bypass" ON departments FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- View: Authors (Church ID matches) AND (Role is admin/leader/superuser OR Member is in department)
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

-- Manage: Admins/Leaders only
CREATE POLICY "Manage departments" ON departments
FOR ALL USING (
    church_id = get_auth_church_id()
    AND get_auth_role() IN ('admin', 'leader', 'superuser')
);


-- === DEPARTMENT MEMBERS ===
CREATE POLICY "Service role bypass" ON department_members FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "View department members" ON department_members
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM departments d
        WHERE d.id = department_members.department_id
        AND d.church_id = get_auth_church_id()
        AND (
            get_auth_role() IN ('admin', 'leader', 'superuser')
            OR
            EXISTS (
                SELECT 1 FROM department_members my_dm
                WHERE my_dm.department_id = d.id
                AND my_dm.member_id = get_auth_member_id()
            )
        )
    )
);

CREATE POLICY "Manage department members" ON department_members
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM departments d
        WHERE d.id = department_members.department_id
        AND d.church_id = get_auth_church_id()
    )
    AND get_auth_role() IN ('admin', 'leader', 'superuser')
);


-- === DEPARTMENT SCHEDULES ===
CREATE POLICY "Service role bypass" ON department_schedules FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "View department schedules" ON department_schedules
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM departments d
        WHERE d.id = department_schedules.department_id
        AND d.church_id = get_auth_church_id()
        AND (
            get_auth_role() IN ('admin', 'leader', 'superuser')
            OR
            EXISTS (
                SELECT 1 FROM department_members my_dm
                WHERE my_dm.department_id = d.id
                AND my_dm.member_id = get_auth_member_id()
            )
        )
    )
);

CREATE POLICY "Manage department schedules" ON department_schedules
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM departments d
        WHERE d.id = department_schedules.department_id
        AND d.church_id = get_auth_church_id()
    )
    AND get_auth_role() IN ('admin', 'leader', 'superuser')
);
