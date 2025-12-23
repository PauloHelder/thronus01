-- DENORMALIZE CHURCH_ID TO FIX RLS RECURSION PERMANENTLY

-- 1. Add church_id columns
ALTER TABLE department_members ADD COLUMN IF NOT EXISTS church_id UUID;
ALTER TABLE department_schedules ADD COLUMN IF NOT EXISTS church_id UUID;
ALTER TABLE department_schedule_assignments ADD COLUMN IF NOT EXISTS church_id UUID;

-- 2. Backfill data
UPDATE department_members dm
SET church_id = d.church_id
FROM departments d
WHERE dm.department_id = d.id
AND dm.church_id IS NULL;

UPDATE department_schedules ds
SET church_id = d.church_id
FROM departments d
WHERE ds.department_id = d.id
AND ds.church_id IS NULL;

UPDATE department_schedule_assignments dsa
SET church_id = ds.church_id
FROM department_schedules ds
WHERE dsa.schedule_id = ds.id
AND dsa.church_id IS NULL;

-- 3. Create Triggers to maintain church_id automatically
-- Function for department_members
CREATE OR REPLACE FUNCTION set_department_members_church_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.church_id IS NULL THEN
        SELECT church_id INTO NEW.church_id
        FROM departments
        WHERE id = NEW.department_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- Security definer to read parent even if user has no access yet

CREATE OR REPLACE TRIGGER trg_set_department_members_church_id
BEFORE INSERT ON department_members
FOR EACH ROW
EXECUTE FUNCTION set_department_members_church_id();

-- Function for department_schedules
CREATE OR REPLACE FUNCTION set_department_schedules_church_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.church_id IS NULL THEN
        SELECT church_id INTO NEW.church_id
        FROM departments
        WHERE id = NEW.department_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_set_department_schedules_church_id
BEFORE INSERT ON department_schedules
FOR EACH ROW
EXECUTE FUNCTION set_department_schedules_church_id();

-- Function for assignments
CREATE OR REPLACE FUNCTION set_assignments_church_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.church_id IS NULL THEN
        SELECT church_id INTO NEW.church_id
        FROM department_schedules
        WHERE id = NEW.schedule_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_set_assignments_church_id
BEFORE INSERT ON department_schedule_assignments
FOR EACH ROW
EXECUTE FUNCTION set_assignments_church_id();


-- 4. UPDATE RLS POLICIES TO USE LOCAL CHURCH_ID (Breaking Recursion)

-- Helper: simple check for member existence using the NEW structure
-- We still need a check for 'Member view own stuff', but it's easier now.
CREATE OR REPLACE FUNCTION check_is_member_of_department_v2(dept_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- This query on department_members is now safe IF department_members policy is simple
    RETURN EXISTS (
        SELECT 1 FROM department_members
        WHERE department_id = dept_id
        AND member_id = (SELECT member_id FROM users WHERE id = auth.uid())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- DEPARTMENT_MEMBERS POLICIES
DROP POLICY IF EXISTS "View department members" ON department_members;
DROP POLICY IF EXISTS "Manage department members" ON department_members;
DROP POLICY IF EXISTS "Admins/Leaders view dept members" ON department_members;

-- Simple Policy: Same Church AND (Admin OR Member of Department)
CREATE POLICY "View department members" ON department_members
FOR SELECT USING (
    church_id = get_auth_church_id()
    AND (
        get_auth_role() IN ('admin', 'leader', 'superuser')
        OR
        -- Member can see members of their own department
        -- We can just check if the user is in this department?
        -- Yes, we can query department_members for the CURRENT user and THIS department.
        -- But wait, that's inquiring the table we are protecting. 
        -- Infinite recursion?
        -- policy on department_members -> select from department_members? Yes recursion.
        -- So we must use SECURITY DEFINER function to check "Am I in this dept?"
        check_is_member_of_department_v2(department_id)
    )
);

CREATE POLICY "Manage department members" ON department_members
FOR ALL USING (
    church_id = get_auth_church_id()
    AND get_auth_role() IN ('admin', 'leader', 'superuser')
);


-- DEPARTMENT_SCHEDULES POLICIES
DROP POLICY IF EXISTS "View department schedules" ON department_schedules;
DROP POLICY IF EXISTS "Manage department schedules" ON department_schedules;

CREATE POLICY "View department schedules" ON department_schedules
FOR SELECT USING (
    church_id = get_auth_church_id()
    AND (
        get_auth_role() IN ('admin', 'leader', 'superuser')
        OR
        check_is_member_of_department_v2(department_id)
    )
);

CREATE POLICY "Manage department schedules" ON department_schedules
FOR ALL USING (
    church_id = get_auth_church_id()
    AND get_auth_role() IN ('admin', 'leader', 'superuser')
);


-- DEPARTMENTS POLICIES (Updated to use V2)
DROP POLICY IF EXISTS "View departments" ON departments;
DROP POLICY IF EXISTS "Manage departments" ON departments;

CREATE POLICY "View departments" ON departments
FOR SELECT USING (
    church_id = get_auth_church_id()
    AND (
        get_auth_role() IN ('admin', 'leader', 'superuser')
        OR
        check_is_member_of_department_v2(id)
    )
);

CREATE POLICY "Manage departments" ON departments
FOR ALL USING (
    church_id = get_auth_church_id()
    AND get_auth_role() IN ('admin', 'leader', 'superuser')
);


-- ASSIGNMENTS POLICIES
DROP POLICY IF EXISTS "View assignments" ON department_schedule_assignments;
DROP POLICY IF EXISTS "Manage assignments" ON department_schedule_assignments;

CREATE POLICY "View assignments" ON department_schedule_assignments
FOR SELECT USING (
    church_id = get_auth_church_id()
    AND (
        get_auth_role() IN ('admin', 'leader', 'superuser')
        OR
        -- Need to know department of this schedule... 
        -- But we don't have department_id on assignments, just schedule_id.
        -- We could optimize adding department_id too, but let's use the helper.
        check_is_member_of_department_v2( (SELECT department_id FROM department_schedules WHERE id = schedule_id LIMIT 1) )
    )
);

CREATE POLICY "Manage assignments" ON department_schedule_assignments
FOR ALL USING (
    church_id = get_auth_church_id()
    AND get_auth_role() IN ('admin', 'leader', 'superuser')
);
