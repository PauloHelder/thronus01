-- Enable RLS for Department tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_schedule_assignments ENABLE ROW LEVEL SECURITY;

-- create helper function to get current user member_id to simplify policies
CREATE OR REPLACE FUNCTION get_auth_member_id()
RETURNS UUID AS $$
    SELECT member_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1. DEPARTMENTS
-- Admins and Leaders can see all departments in their church
CREATE POLICY "Admins/Leaders view all departments" ON departments
FOR SELECT USING (
    church_id = (SELECT church_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'leader')
);

-- Members can only see departments they belong to
CREATE POLICY "Members view their departments" ON departments
FOR SELECT USING (
    church_id = (SELECT church_id FROM users WHERE id = auth.uid())
    AND EXISTS (
        SELECT 1 FROM department_members dm
        WHERE dm.department_id = departments.id
        AND dm.member_id = get_auth_member_id()
    )
);

-- Admins/Leaders can Insert/Update/Delete departments
CREATE POLICY "Admins/Leaders manage departments" ON departments
FOR ALL USING (
    church_id = (SELECT church_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'leader')
);

-- 2. DEPARTMENT MEMBERS
-- Admins/Leaders view all
CREATE POLICY "Admins/Leaders view dept members" ON department_members
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM departments d
        JOIN users u ON u.church_id = d.church_id
        WHERE d.id = department_members.department_id
        AND u.id = auth.uid()
        AND u.role IN ('admin', 'leader')
    )
);

-- Members view members of their own departments
CREATE POLICY "Members view their dept colleagues" ON department_members
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM department_members my_dm
        WHERE my_dm.department_id = department_members.department_id
        AND my_dm.member_id = get_auth_member_id()
    )
);

-- Admins/Leaders manage members
CREATE POLICY "Admins/Leaders manage dept members" ON department_members
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM departments d
        JOIN users u ON u.church_id = d.church_id
        WHERE d.id = department_members.department_id
        AND u.id = auth.uid()
        AND u.role IN ('admin', 'leader')
    )
);

-- 3. DEPARTMENT SCHEDULES
-- Admins/Leaders view all
CREATE POLICY "Admins/Leaders view schedules" ON department_schedules
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM departments d
        JOIN users u ON u.church_id = d.church_id
        WHERE d.id = department_schedules.department_id
        AND u.id = auth.uid()
        AND u.role IN ('admin', 'leader')
    )
);

-- Members view schedules of their departments
CREATE POLICY "Members view their dept schedules" ON department_schedules
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM department_members my_dm
        WHERE my_dm.department_id = department_schedules.department_id
        AND my_dm.member_id = get_auth_member_id()
    )
);

-- Admins/Leaders manage schedules
CREATE POLICY "Admins/Leaders manage schedules" ON department_schedules
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM departments d
        JOIN users u ON u.church_id = d.church_id
        WHERE d.id = department_schedules.department_id
        AND u.id = auth.uid()
        AND u.role IN ('admin', 'leader')
    )
);
