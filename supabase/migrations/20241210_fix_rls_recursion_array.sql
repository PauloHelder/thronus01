-- FIX RLS INFINITE RECURSION BY USING ARRAY LOOKUP FUNCTION

-- 1. Create a safe function to get all department IDs for the current user
-- This runs as SECURITY DEFINER (superuser), so it bypasses RLS on 'department_members'
-- preventing the "policy calls table calls policy" loop.
CREATE OR REPLACE FUNCTION get_my_department_ids()
RETURNS UUID[] AS $$
DECLARE
    current_member_id UUID;
    dept_ids UUID[];
BEGIN
    -- Get current member_id safely
    SELECT member_id INTO current_member_id FROM users WHERE id = auth.uid();
    
    IF current_member_id IS NULL THEN
        RETURN ARRAY[]::UUID[];
    END IF;

    -- Collect all department_ids where this user is a member
    SELECT ARRAY_AGG(department_id)
    INTO dept_ids
    FROM department_members
    WHERE member_id = current_member_id;

    IF dept_ids IS NULL THEN
        RETURN ARRAY[]::UUID[];
    END IF;

    RETURN dept_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Update DEPARTMENTS Policy
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View departments" ON departments;

CREATE POLICY "View departments" ON departments
FOR SELECT USING (
    church_id = get_auth_church_id()
    AND (
        get_auth_role() IN ('admin', 'leader', 'superuser')
        OR
        id = ANY(get_my_department_ids())
    )
);


-- 3. Update DEPARTMENT_MEMBERS Policy
ALTER TABLE department_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View department members" ON department_members;

CREATE POLICY "View department members" ON department_members
FOR SELECT USING (
    church_id = get_auth_church_id()
    AND (
        get_auth_role() IN ('admin', 'leader', 'superuser')
        OR
        department_id = ANY(get_my_department_ids())
        OR
        member_id = (SELECT member_id FROM users WHERE id = auth.uid()) -- redundant but safe
    )
);


-- 4. Update DEPARTMENT_SCHEDULES Policy
ALTER TABLE department_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View department schedules" ON department_schedules;

CREATE POLICY "View department schedules" ON department_schedules
FOR SELECT USING (
    church_id = get_auth_church_id()
    AND (
        get_auth_role() IN ('admin', 'leader', 'superuser')
        OR
        department_id = ANY(get_my_department_ids())
    )
);


-- 5. Update ASSIGNMENTS Policy
ALTER TABLE department_schedule_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View assignments" ON department_schedule_assignments;

-- Note: Assignments don't have department_id directly, need to join via schedule.
-- We can look up the schedule's department efficiently, or rely on the join.
-- To avoid join recursion, we added church_id. We didn't add department_id to assignments.
-- Let's use a helper that is safe.

CREATE OR REPLACE FUNCTION get_assignment_department_id(sched_id UUID)
RETURNS UUID AS $$
    SELECT department_id FROM department_schedules WHERE id = sched_id;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "View assignments" ON department_schedule_assignments
FOR SELECT USING (
    church_id = get_auth_church_id()
    AND (
        get_auth_role() IN ('admin', 'leader', 'superuser')
        OR
        get_assignment_department_id(schedule_id) = ANY(get_my_department_ids())
    )
);
