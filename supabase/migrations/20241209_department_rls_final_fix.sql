-- CLEANUP AND FIX DEPARTMENT RLS
-- We will drop ALL existing policies on department tables to ensure a clean slate
-- and then re-apply the correct logic including Superusers and proper Member restriction.

-- 1. Helper function for member_id lookup (if not exists)
CREATE OR REPLACE FUNCTION get_auth_member_id()
RETURNS UUID AS $$
    SELECT member_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Drop ALL existing policies for Department tables
-- DEPARTMENTS
DROP POLICY IF EXISTS "Users can view departments from their church" ON departments;
DROP POLICY IF EXISTS "Users can manage departments" ON departments;
DROP POLICY IF EXISTS "Admins/Leaders view all departments" ON departments;
DROP POLICY IF EXISTS "Members view their departments" ON departments;
DROP POLICY IF EXISTS "Admins/Leaders manage departments" ON departments;
DROP POLICY IF EXISTS "Service role bypass" ON departments;

-- DEPARTMENT MEMBERS
DROP POLICY IF EXISTS "Users can view department members" ON department_members;
DROP POLICY IF EXISTS "Users can manage department members" ON department_members;
DROP POLICY IF EXISTS "Admins/Leaders view dept members" ON department_members;
DROP POLICY IF EXISTS "Members view their dept colleagues" ON department_members;
DROP POLICY IF EXISTS "Admins/Leaders manage dept members" ON department_members;
DROP POLICY IF EXISTS "Service role bypass" ON department_members;

-- DEPARTMENT SCHEDULES
DROP POLICY IF EXISTS "Users can view department schedules" ON department_schedules;
DROP POLICY IF EXISTS "Users can manage department schedules" ON department_schedules;
DROP POLICY IF EXISTS "Admins/Leaders view schedules" ON department_schedules;
DROP POLICY IF EXISTS "Members view their dept schedules" ON department_schedules;
DROP POLICY IF EXISTS "Admins/Leaders manage schedules" ON department_schedules;
DROP POLICY IF EXISTS "Service role bypass" ON department_schedules;

-- DEPARTMENT SCHEDULE ASSIGNMENTS
DROP POLICY IF EXISTS "Users can view department schedule assignments" ON department_schedule_assignments;
DROP POLICY IF EXISTS "Users can manage department schedule assignments" ON department_schedule_assignments;
DROP POLICY IF EXISTS "Service role bypass" ON department_schedule_assignments;


-- 3. APPLY NEW POLICIES

-- === DEPARTMENTS ===

-- Service Role Bypass
CREATE POLICY "Service role bypass" ON departments FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Admins, Leaders, Superusers: View ALL departments in their church
CREATE POLICY "Admins/Leaders view all" ON departments
FOR SELECT USING (
    church_id = (SELECT church_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'leader', 'superuser')
        OR
        -- Fallback: If user is admin via is_admin() function logic (just in case)
        (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
    )
);

-- Members: View ONLY departments they belong to
CREATE POLICY "Members view assigned" ON departments
FOR SELECT USING (
    church_id = (SELECT church_id FROM users WHERE id = auth.uid())
    AND (
        (SELECT role FROM users WHERE id = auth.uid()) = 'member'
    )
    AND EXISTS (
        SELECT 1 FROM department_members dm
        WHERE dm.department_id = departments.id
        AND dm.member_id = get_auth_member_id()
    )
);

-- Admins/Leaders/Superusers: Manage (Insert, Update, Delete)
CREATE POLICY "Admins/Leaders manage" ON departments
FOR ALL USING (
    church_id = (SELECT church_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'leader', 'superuser')
);


-- === DEPARTMENT MEMBERS ===

CREATE POLICY "Service role bypass" ON department_members FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Admins/Leaders: View All
CREATE POLICY "Admins/Leaders view all members" ON department_members
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM departments d
        JOIN users u ON u.church_id = d.church_id
        WHERE d.id = department_members.department_id
        AND u.id = auth.uid()
        AND u.role IN ('admin', 'leader', 'superuser')
    )
);

-- Members: View colleagues in their departments
CREATE POLICY "Members view assigned members" ON department_members
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM department_members my_dm
        WHERE my_dm.department_id = department_members.department_id
        AND my_dm.member_id = get_auth_member_id()
    )
);

-- Admins/Leaders: Manage
CREATE POLICY "Admins/Leaders manage members" ON department_members
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM departments d
        JOIN users u ON u.church_id = d.church_id
        WHERE d.id = department_members.department_id
        AND u.id = auth.uid()
        AND u.role IN ('admin', 'leader', 'superuser')
    )
);


-- === DEPARTMENT SCHEDULES ===

CREATE POLICY "Service role bypass" ON department_schedules FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Admins/Leaders: View All
CREATE POLICY "Admins/Leaders view all schedules" ON department_schedules
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM departments d
        JOIN users u ON u.church_id = d.church_id
        WHERE d.id = department_schedules.department_id
        AND u.id = auth.uid()
        AND u.role IN ('admin', 'leader', 'superuser')
    )
);

-- Members: View schedules for their departments
CREATE POLICY "Members view assigned schedules" ON department_schedules
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM department_members my_dm
        WHERE my_dm.department_id = department_schedules.department_id
        AND my_dm.member_id = get_auth_member_id()
    )
);

-- Admins/Leaders: Manage
CREATE POLICY "Admins/Leaders manage schedules" ON department_schedules
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM departments d
        JOIN users u ON u.church_id = d.church_id
        WHERE d.id = department_schedules.department_id
        AND u.id = auth.uid()
        AND u.role IN ('admin', 'leader', 'superuser')
    )
);

-- === DEPARTMENT DETAILS (ASSIGNMENTS) ===
-- Re-applying basic logic for assignments too
CREATE POLICY "Service role bypass" ON department_schedule_assignments FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Everyone view assignments" ON department_schedule_assignments
FOR SELECT USING (
    -- If you can see the schedule, you can see the assignment
    EXISTS (
        SELECT 1 FROM department_schedules ds
        WHERE ds.id = department_schedule_assignments.schedule_id
    )
);

CREATE POLICY "Admins/Leaders manage assignments" ON department_schedule_assignments
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM department_schedules ds
        JOIN departments d ON d.id = ds.department_id
        JOIN users u ON u.church_id = d.church_id
        WHERE ds.id = department_schedule_assignments.schedule_id
        AND u.id = auth.uid()
        AND u.role IN ('admin', 'leader', 'superuser')
    )
);
