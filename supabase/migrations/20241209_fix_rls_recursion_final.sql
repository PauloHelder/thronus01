-- FIX INFINITE RECURSION IN RLS

-- 1. Helper function to check department church WITHOUT triggering departments RLS
CREATE OR REPLACE FUNCTION get_department_church_id(dept_id UUID)
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT church_id FROM departments WHERE id = dept_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Helper function to check membership WITHOUT triggering department_members RLS
-- (Re-declaring to ensure it is definitely SECURITY DEFINER)
CREATE OR REPLACE FUNCTION check_is_member_of_department(dept_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_member_id UUID;
BEGIN
    -- Get current user's member_id
    SELECT member_id INTO current_member_id FROM users WHERE id = auth.uid();
    
    IF current_member_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Direct query on department_members, relying on SECURITY DEFINER to bypass RLS
    RETURN EXISTS (
        SELECT 1 FROM department_members
        WHERE department_id = dept_id
        AND member_id = current_member_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. DEPARTMENTS POLICY
-- Only Admins/Leaders (of that church) OR Members (of that department)
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View departments" ON departments;
DROP POLICY IF EXISTS "Manage departments" ON departments;

CREATE POLICY "View departments" ON departments
FOR SELECT USING (
    church_id = get_auth_church_id()
    AND (
        get_auth_role() IN ('admin', 'leader', 'superuser')
        OR
        check_is_member_of_department(id)
    )
);

CREATE POLICY "Manage departments" ON departments
FOR ALL USING (
    church_id = get_auth_church_id()
    AND get_auth_role() IN ('admin', 'leader', 'superuser')
);


-- 4. DEPARTMENT_MEMBERS POLICY
-- Breaking the recursion: Use get_department_church_id() instead of joining 'departments' table
ALTER TABLE department_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View department members" ON department_members;
DROP POLICY IF EXISTS "Manage department members" ON department_members;

CREATE POLICY "View department members" ON department_members
FOR SELECT USING (
    (
        get_auth_role() IN ('admin', 'leader', 'superuser')
        AND 
        get_department_church_id(department_id) = get_auth_church_id()
    )
    OR
    check_is_member_of_department(department_id)
);

CREATE POLICY "Manage department members" ON department_members
FOR ALL USING (
    get_auth_role() IN ('admin', 'leader', 'superuser')
    AND 
    get_department_church_id(department_id) = get_auth_church_id()
);


-- 5. DEPARTMENT_SCHEDULES POLICY
-- Breaking recursion here too
ALTER TABLE department_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View department schedules" ON department_schedules;
DROP POLICY IF EXISTS "Manage department schedules" ON department_schedules;

CREATE POLICY "View department schedules" ON department_schedules
FOR SELECT USING (
    (
        get_auth_role() IN ('admin', 'leader', 'superuser')
        AND 
        get_department_church_id(department_id) = get_auth_church_id()
    )
    OR
    check_is_member_of_department(department_id)
);

CREATE POLICY "Manage department schedules" ON department_schedules
FOR ALL USING (
    get_auth_role() IN ('admin', 'leader', 'superuser')
    AND 
    get_department_church_id(department_id) = get_auth_church_id()
);

-- 6. ASSIGNMENTS POLICY
ALTER TABLE department_schedule_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View assignments" ON department_schedule_assignments;
DROP POLICY IF EXISTS "Manage assignments" ON department_schedule_assignments;

-- Create helper for schedule lookup to avoid joining department_schedules -> departments
CREATE OR REPLACE FUNCTION get_schedule_department_id(sched_id UUID)
RETURNS UUID AS $$
    SELECT department_id FROM department_schedules WHERE id = sched_id;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "View assignments" ON department_schedule_assignments
FOR SELECT USING (
    (
        get_auth_role() IN ('admin', 'leader', 'superuser')
        AND 
        get_department_church_id(get_schedule_department_id(schedule_id)) = get_auth_church_id()
    )
    OR
    check_is_member_of_department(get_schedule_department_id(schedule_id))
);

CREATE POLICY "Manage assignments" ON department_schedule_assignments
FOR ALL USING (
    get_auth_role() IN ('admin', 'leader', 'superuser')
    AND 
    get_department_church_id(get_schedule_department_id(schedule_id)) = get_auth_church_id()
);
