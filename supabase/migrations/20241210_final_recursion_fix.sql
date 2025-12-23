-- FINAL RECURSION FIX: Wipe all policies and reset to simple church-based visibility.

-- 1. Helper Function
CREATE OR REPLACE FUNCTION get_auth_church_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT church_id FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. WIPE ALL POLICIES on Department tables safely
DO $$ 
DECLARE 
    pol record; 
BEGIN 
    -- Departments
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'departments' LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON departments', pol.policyname); 
    END LOOP;

    -- Department Members
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'department_members' LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON department_members', pol.policyname); 
    END LOOP;

    -- Department Schedules
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'department_schedules' LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON department_schedules', pol.policyname); 
    END LOOP;

    -- Department Schedule Assignments
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'department_schedule_assignments' LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON department_schedule_assignments', pol.policyname); 
    END LOOP;
END $$;

-- 3. RE-ENABLE RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_schedule_assignments ENABLE ROW LEVEL SECURITY;

-- 4. CREATE SIMPLE, NON-RECURSIVE POLICIES
-- Everyone in the church can VIEW everything in departments module.
-- Management is restricted to admin/leader/superuser.

-- === DEPARTMENTS ===
CREATE POLICY "View departments" ON departments
FOR SELECT USING ( church_id = get_auth_church_id() );

CREATE POLICY "Manage departments" ON departments
FOR ALL USING (
    church_id = get_auth_church_id()
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'leader', 'superuser')
);

-- === DEPARTMENT MEMBERS ===
CREATE POLICY "View department members" ON department_members
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM departments d
        WHERE d.id = department_members.department_id
        AND d.church_id = get_auth_church_id()
    )
);

CREATE POLICY "Manage department members" ON department_members
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM departments d
        WHERE d.id = department_members.department_id
        AND d.church_id = get_auth_church_id()
    )
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'leader', 'superuser')
);

-- === DEPARTMENT SCHEDULES ===
CREATE POLICY "View department schedules" ON department_schedules
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM departments d
        WHERE d.id = department_schedules.department_id
        AND d.church_id = get_auth_church_id()
    )
);

CREATE POLICY "Manage department schedules" ON department_schedules
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM departments d
        WHERE d.id = department_schedules.department_id
        AND d.church_id = get_auth_church_id()
    )
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'leader', 'superuser')
);

-- === DEPARTMENT SCHEDULE ASSIGNMENTS ===
CREATE POLICY "View assignments" ON department_schedule_assignments
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM department_schedules ds
        JOIN departments d ON d.id = ds.department_id
        WHERE ds.id = department_schedule_assignments.schedule_id
        AND d.church_id = get_auth_church_id()
    )
);

CREATE POLICY "Manage assignments" ON department_schedule_assignments
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM department_schedules ds
        JOIN departments d ON d.id = ds.department_id
        WHERE ds.id = department_schedule_assignments.schedule_id
        AND d.church_id = get_auth_church_id()
    )
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'leader', 'superuser')
);
