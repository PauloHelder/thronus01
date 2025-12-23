-- Fix Department Visibility: Admin sees all, Leader/Member sees assigned only.
-- Fix Recursion: Use SECURITY DEFINER functions for cross-table checks.

-- 1. Helper: Check if department belongs to user's church (Security Definer to avoid RLS loop)
CREATE OR REPLACE FUNCTION is_department_in_user_church(dept_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM departments d
        WHERE d.id = dept_id
        AND d.church_id = (SELECT church_id FROM users WHERE id = auth.uid())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Departments Table RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins/Leaders view all" ON departments;
DROP POLICY IF EXISTS "Members view assigned" ON departments;
DROP POLICY IF EXISTS "Anyone view departments" ON departments;
DROP POLICY IF EXISTS "Admins view all" ON departments;
DROP POLICY IF EXISTS "Members and Leaders view assigned" ON departments;
DROP POLICY IF EXISTS "Admins/Leaders manage" ON departments;
DROP POLICY IF EXISTS "Manage departments" ON departments;
DROP POLICY IF EXISTS "View departments" ON departments;


-- Policy 1: Admins and Superusers view ALL in their church
CREATE POLICY "Admins view all" ON departments
FOR SELECT USING (
    is_admin() -- Checks admin/superuser, excludes leader
    AND 
    church_id = (SELECT church_id FROM users WHERE id = auth.uid())
);

-- Policy 2: Members AND Leaders view ONLY assigned departments
CREATE POLICY "Members and Leaders view assigned" ON departments
FOR SELECT USING (
    church_id = (SELECT church_id FROM users WHERE id = auth.uid())
    AND EXISTS (
        SELECT 1 FROM department_members dm
        WHERE dm.department_id = departments.id
        AND dm.member_id = get_auth_member_id()
    )
);

-- Manage: Admins Manage All
CREATE POLICY "Admins manage all" ON departments
FOR ALL USING (
    is_admin() 
    AND 
    church_id = (SELECT church_id FROM users WHERE id = auth.uid())
);

-- Manage: Leaders Manage Assigned (Only the ones they are in)
CREATE POLICY "Leaders manage assigned" ON departments
FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'leader'
    AND
    church_id = (SELECT church_id FROM users WHERE id = auth.uid())
    AND EXISTS (
        SELECT 1 FROM department_members dm
        WHERE dm.department_id = departments.id
        AND dm.member_id = get_auth_member_id()
    )
);


-- 3. Department Members RLS (Fix Recursion)
ALTER TABLE department_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins/Leaders view all members" ON department_members;
DROP POLICY IF EXISTS "Members view assigned members" ON department_members;
DROP POLICY IF EXISTS "Admins/Leaders manage members" ON department_members;

-- Policy 1: Admins view ALL members in church departments
-- Uses SECURITY DEFINER function to check department church without triggering department RLS
CREATE POLICY "Admins view all members" ON department_members
FOR SELECT USING (
    is_admin()
    AND
    is_department_in_user_church(department_id)
);

-- Policy 2: Members/Leaders view members in their own departments
CREATE POLICY "Members/Leaders view assigned members" ON department_members
FOR SELECT USING (
    -- I can see a department_member row IF:
    -- 1. It is ME.
    member_id = get_auth_member_id()
    OR
    -- 2. It is a colleague in a department I am part of.
    -- Check if I am in the same department_id
    EXISTS (
        SELECT 1 FROM department_members my_dm 
        WHERE my_dm.department_id = department_members.department_id
        AND my_dm.member_id = get_auth_member_id()
    )
);

-- Manage Members: Admins All
CREATE POLICY "Admins manage members" ON department_members
FOR ALL USING (
    is_admin()
    AND
    is_department_in_user_church(department_id)
);

-- Manage Members: Leaders Assigned
CREATE POLICY "Leaders manage assigned members" ON department_members
FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'leader'
    AND
    exists (
        SELECT 1 FROM department_members dm
        WHERE dm.department_id = department_members.department_id
        AND dm.member_id = get_auth_member_id()
    )
);


-- 4. Department Schedules RLS (Consistency)
ALTER TABLE department_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins/Leaders view all schedules" ON department_schedules;
DROP POLICY IF EXISTS "Members view assigned schedules" ON department_schedules;
DROP POLICY IF EXISTS "Admins/Leaders manage schedules" ON department_schedules;

-- Admins view all
CREATE POLICY "Admins view all schedules" ON department_schedules
FOR SELECT USING (
    is_admin() 
    AND 
    is_department_in_user_church(department_id)
);

-- Leaders/Members view assigned
CREATE POLICY "Members/Leaders view assigned schedules" ON department_schedules
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM department_members dm 
        WHERE dm.department_id = department_schedules.department_id
        AND dm.member_id = get_auth_member_id()
    )
);

-- Admins Manage
CREATE POLICY "Admins manage schedules" ON department_schedules
FOR ALL USING (
    is_admin() 
    AND 
    is_department_in_user_church(department_id)
);

-- Leaders Manage Assigned
CREATE POLICY "Leaders manage assigned schedules" ON department_schedules
FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'leader'
    AND 
    EXISTS (
        SELECT 1 FROM department_members dm 
        WHERE dm.department_id = department_schedules.department_id
        AND dm.member_id = get_auth_member_id()
    )
);
