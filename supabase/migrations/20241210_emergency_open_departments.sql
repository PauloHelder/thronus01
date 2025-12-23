-- EMERGENCY: Make Departments Visible to ALL Users in the Church
-- This reverts the restrictive visibility. Everyone in the church can see all departments.

-- 1. Helper to safely get church_id (Bypasses RLS on users table)
CREATE OR REPLACE FUNCTION get_auth_church_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT church_id FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. DEPARTMENTS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Drop all restrictive View policies
DROP POLICY IF EXISTS "Admins view all" ON departments;
DROP POLICY IF EXISTS "Members and Leaders view assigned" ON departments;
DROP POLICY IF EXISTS "Admins/Leaders view all" ON departments;
DROP POLICY IF EXISTS "Members view assigned" ON departments;
DROP POLICY IF EXISTS "Users can view departments from their church" ON departments;
DROP POLICY IF EXISTS "Admins manage all" ON departments;
DROP POLICY IF EXISTS "Leaders manage assigned" ON departments;
DROP POLICY IF EXISTS "Admins/Leaders manage" ON departments;
DROP POLICY IF EXISTS "View all departments in church" ON departments;
DROP POLICY IF EXISTS "Manage departments" ON departments;

-- OPEN VIEW POLICY: Everyone in the church sees ALL departments
CREATE POLICY "View all departments in church" ON departments
FOR SELECT USING (
    church_id = get_auth_church_id()
);

-- RESTORE MANAGEMENT (Admins/Leaders still need permissions to edit, but we keep it simple for now)
CREATE POLICY "Manage departments" ON departments
FOR ALL USING (
    church_id = get_auth_church_id()
    AND (
        (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'leader', 'superuser')
    )
);


-- 3. DEPARTMENT MEMBERS
ALTER TABLE department_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view all members" ON department_members;
DROP POLICY IF EXISTS "Members/Leaders view assigned members" ON department_members;
DROP POLICY IF EXISTS "Admins manage members" ON department_members;
DROP POLICY IF EXISTS "Admins/Leaders manage members" ON department_members;
DROP POLICY IF EXISTS "View all department members" ON department_members;
DROP POLICY IF EXISTS "Manage department members" ON department_members;

-- OPEN VIEW POLICY
CREATE POLICY "View all department members" ON department_members
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM departments d
        WHERE d.id = department_members.department_id
        AND d.church_id = get_auth_church_id()
    )
);

-- MANAGE POLICY
CREATE POLICY "Manage department members" ON department_members
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM departments d
        WHERE d.id = department_members.department_id
        AND d.church_id = get_auth_church_id()
    )
    AND (
        (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'leader', 'superuser')
    )
);


-- 4. DEPARTMENT SCHEDULES
ALTER TABLE department_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view all schedules" ON department_schedules;
DROP POLICY IF EXISTS "Members/Leaders view assigned schedules" ON department_schedules;
DROP POLICY IF EXISTS "Admins manage schedules" ON department_schedules;
DROP POLICY IF EXISTS "Admins/Leaders manage schedules" ON department_schedules;
DROP POLICY IF EXISTS "View all department schedules" ON department_schedules;
DROP POLICY IF EXISTS "Manage department schedules" ON department_schedules;

-- OPEN VIEW POLICY
CREATE POLICY "View all department schedules" ON department_schedules
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM departments d
        WHERE d.id = department_schedules.department_id
        AND d.church_id = get_auth_church_id()
    )
);

-- MANAGE POLICY
CREATE POLICY "Manage department schedules" ON department_schedules
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM departments d
        WHERE d.id = department_schedules.department_id
        AND d.church_id = get_auth_church_id()
    )
    AND (
        (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'leader', 'superuser')
    )
);
