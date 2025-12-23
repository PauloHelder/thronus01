-- Fix Department Visibility Logic
-- Ensures Admins/Leaders/Superusers see all.
-- Ensures Members ONLY see departments they belong to.
-- Uses SECURITY DEFINER functions to prevent RLS recursion.

-- 1. Helper Function: Check if current user is a member of the given department
CREATE OR REPLACE FUNCTION check_is_member_of_department(dept_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_member_id UUID;
BEGIN
    -- Get current user's member_id efficiently
    SELECT member_id INTO current_member_id FROM users WHERE id = auth.uid();
    
    IF current_member_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Check existence in department_members using elevated privileges (Security Definer)
    RETURN EXISTS (
        SELECT 1 FROM department_members
        WHERE department_id = dept_id
        AND member_id = current_member_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Reset and Apply Policies for DEPARTMENTS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View departments" ON departments;
DROP POLICY IF EXISTS "Manage departments" ON departments;
DROP POLICY IF EXISTS "Admins/Leaders view all departments" ON departments;
DROP POLICY IF EXISTS "Members view their departments" ON departments;
DROP POLICY IF EXISTS "Admins/Leaders manage departments" ON departments;

-- View Policy
CREATE POLICY "View departments" ON departments
FOR SELECT USING (
    church_id = get_auth_church_id()
    AND (
        get_auth_role() IN ('admin', 'leader', 'superuser')
        OR
        check_is_member_of_department(id)
    )
);

-- Manage Policy
CREATE POLICY "Manage departments" ON departments
FOR ALL USING (
    church_id = get_auth_church_id()
    AND get_auth_role() IN ('admin', 'leader', 'superuser')
);


-- 3. Reset and Apply Policies for DEPARTMENT_MEMBERS
ALTER TABLE department_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View department members" ON department_members;
DROP POLICY IF EXISTS "Manage department members" ON department_members;
DROP POLICY IF EXISTS "Admins/Leaders view dept members" ON department_members;
DROP POLICY IF EXISTS "Members view their dept colleagues" ON department_members;
DROP POLICY IF EXISTS "Admins/Leaders manage dept members" ON department_members;
DROP POLICY IF EXISTS "See own membership" ON department_members;

-- View Policy
CREATE POLICY "View department members" ON department_members
FOR SELECT USING (
    -- Admin/Leader check (must also verify church ownership via department)
    (
        get_auth_role() IN ('admin', 'leader', 'superuser')
        AND EXISTS (
             SELECT 1 FROM departments d 
             WHERE d.id = department_members.department_id 
             AND d.church_id = get_auth_church_id()
        )
    )
    OR
    -- Member check (can see all members of their own departments)
    check_is_member_of_department(department_id)
);

-- Manage Policy
CREATE POLICY "Manage department members" ON department_members
FOR ALL USING (
    get_auth_role() IN ('admin', 'leader', 'superuser')
    AND EXISTS (
         SELECT 1 FROM departments d 
         WHERE d.id = department_members.department_id 
         AND d.church_id = get_auth_church_id()
    )
);


-- 4. Reset and Apply Policies for DEPARTMENT_SCHEDULES
ALTER TABLE department_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View department schedules" ON department_schedules;
DROP POLICY IF EXISTS "Manage department schedules" ON department_schedules;
DROP POLICY IF EXISTS "Admins/Leaders view schedules" ON department_schedules;
DROP POLICY IF EXISTS "Members view their dept schedules" ON department_schedules;
DROP POLICY IF EXISTS "Admins/Leaders manage schedules" ON department_schedules;

-- View Policy
CREATE POLICY "View department schedules" ON department_schedules
FOR SELECT USING (
    -- Admin/Leader check
    (
        get_auth_role() IN ('admin', 'leader', 'superuser')
        AND EXISTS (
             SELECT 1 FROM departments d 
             WHERE d.id = department_schedules.department_id 
             AND d.church_id = get_auth_church_id()
        )
    )
    OR
    -- Member check
    check_is_member_of_department(department_id)
);

-- Manage Policy
CREATE POLICY "Manage department schedules" ON department_schedules
FOR ALL USING (
    get_auth_role() IN ('admin', 'leader', 'superuser')
    AND EXISTS (
         SELECT 1 FROM departments d 
         WHERE d.id = department_schedules.department_id 
         AND d.church_id = get_auth_church_id()
    )
);


-- 5. Reset and Apply Policies for DEPARTMENT_SCHEDULE_ASSIGNMENTS
ALTER TABLE department_schedule_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View assignments" ON department_schedule_assignments;
DROP POLICY IF EXISTS "Manage assignments" ON department_schedule_assignments;

-- View Policy
CREATE POLICY "View assignments" ON department_schedule_assignments
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM department_schedules ds
        WHERE ds.id = department_schedule_assignments.schedule_id
        AND (
            (
                get_auth_role() IN ('admin', 'leader', 'superuser')
                AND EXISTS (SELECT 1 FROM departments d WHERE d.id = ds.department_id AND d.church_id = get_auth_church_id())
            )
            OR
            check_is_member_of_department(ds.department_id)
        )
    )
);

-- Manage Policy
CREATE POLICY "Manage assignments" ON department_schedule_assignments
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM department_schedules ds
        WHERE ds.id = department_schedule_assignments.schedule_id
        AND (
            get_auth_role() IN ('admin', 'leader', 'superuser')
            AND EXISTS (SELECT 1 FROM departments d WHERE d.id = ds.department_id AND d.church_id = get_auth_church_id())
        )
    )
);
