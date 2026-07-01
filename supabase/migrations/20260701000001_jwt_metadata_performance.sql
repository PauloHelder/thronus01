-- =====================================================
-- HIGH-PERFORMANCE RLS OPTIMIZATION - JWT METADATA SYNC
-- =====================================================

-- 1. CREATE TRIGGER TO AUTOMATICALLY SYNC CHURCH_ID AND ROLE TO AUTH.USERS METADATA
CREATE OR REPLACE FUNCTION public.sync_user_church_id_to_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE auth.users
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object(
            'church_id', NEW.church_id,
            'role', NEW.role
        )
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_user_church_id_to_metadata ON public.users;
CREATE TRIGGER trigger_sync_user_church_id_to_metadata
    AFTER INSERT OR UPDATE OF church_id, role ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_user_church_id_to_metadata();

-- 2. BULK SYNC EXISTING USERS
UPDATE auth.users u
SET raw_user_meta_data = COALESCE(u.raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
        'church_id', p.church_id,
        'role', p.role
    )
FROM public.users p
WHERE u.id = p.id;

-- 3. REDEFINE GET_USER_CHURCH_ID WITH INSTANT JWT RETRIEVAL AND BACKWARD COMPATIBILITY FALLBACK
CREATE OR REPLACE FUNCTION public.get_user_church_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_church_id UUID;
BEGIN
    -- 1. Try to read directly from JWT claims (memory operation, 0 database overhead, avoids recursion)
    v_church_id := (auth.jwt() -> 'user_metadata' ->> 'church_id')::uuid;
    
    -- 2. Fallback to querying public.users only if JWT lacks the claim (e.g. background tasks, old active sessions)
    IF v_church_id IS NULL THEN
        SELECT church_id INTO v_church_id
        FROM public.users
        WHERE id = auth.uid()
        LIMIT 1;
    END IF;
    
    RETURN v_church_id;
END;
$$;

-- 4. REDEFINE USER_HAS_DEPARTMENT_ACCESS WITH JWT EXTRACTION AND FALLBACK
CREATE OR REPLACE FUNCTION public.user_has_department_access()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_role text;
    v_permissions jsonb;
BEGIN
    -- 1. Try to read role from JWT (memory-based)
    v_role := auth.jwt() -> 'user_metadata' ->> 'role';
    
    -- 2. Fetch role and permissions from public.users if not fully available
    IF v_role IS NULL THEN
        SELECT role, permissions INTO v_role, v_permissions
        FROM public.users
        WHERE id = auth.uid()
        LIMIT 1;
    ELSE
        SELECT permissions INTO v_permissions
        FROM public.users
        WHERE id = auth.uid()
        LIMIT 1;
    END IF;

    -- Evaluate access rights
    RETURN (
        v_role IN ('admin', 'supervisor', 'leader')
        OR v_permissions ? 'manage_departments'
        OR v_permissions ? 'departments_create'
        OR v_permissions ? 'departments_edit'
    );
END;
$$;

-- 5. APPLY HIGH-PERFORMANCE RLS POLICIES USING CACHED GET_USER_CHURCH_ID()

-- financial_accounts
DROP POLICY IF EXISTS "Users can view accounts from their church" ON financial_accounts;
DROP POLICY IF EXISTS "Users can insert accounts for their church" ON financial_accounts;
DROP POLICY IF EXISTS "Users can update accounts from their church" ON financial_accounts;
DROP POLICY IF EXISTS "Users can delete accounts from their church" ON financial_accounts;

CREATE POLICY "Users can view accounts from their church" ON financial_accounts
    FOR SELECT USING (church_id = get_user_church_id());

CREATE POLICY "Users can insert accounts for their church" ON financial_accounts
    FOR INSERT WITH CHECK (church_id = get_user_church_id());

CREATE POLICY "Users can update accounts from their church" ON financial_accounts
    FOR UPDATE USING (church_id = get_user_church_id());

CREATE POLICY "Users can delete accounts from their church" ON financial_accounts
    FOR DELETE USING (church_id = get_user_church_id());

-- financial_categories
DROP POLICY IF EXISTS "Users can view categories from their church" ON financial_categories;
DROP POLICY IF EXISTS "Users can insert categories for their church" ON financial_categories;
DROP POLICY IF EXISTS "Users can update categories from their church" ON financial_categories;
DROP POLICY IF EXISTS "Users can delete categories from their church" ON financial_categories;

CREATE POLICY "Users can view categories from their church" ON financial_categories
    FOR SELECT USING (church_id = get_user_church_id());

CREATE POLICY "Users can insert categories for their church" ON financial_categories
    FOR INSERT WITH CHECK (church_id = get_user_church_id());

CREATE POLICY "Users can update categories from their church" ON financial_categories
    FOR UPDATE USING (church_id = get_user_church_id());

CREATE POLICY "Users can delete categories from their church" ON financial_categories
    FOR DELETE USING (church_id = get_user_church_id());

-- financial_transactions
DROP POLICY IF EXISTS "Users can view transactions from their church" ON financial_transactions;
DROP POLICY IF EXISTS "Users can insert transactions for their church" ON financial_transactions;
DROP POLICY IF EXISTS "Users can update transactions from their church" ON financial_transactions;
DROP POLICY IF EXISTS "Users can delete transactions from their church" ON financial_transactions;

CREATE POLICY "Users can view transactions from their church" ON financial_transactions
    FOR SELECT USING (church_id = get_user_church_id());

CREATE POLICY "Users can insert transactions for their church" ON financial_transactions
    FOR INSERT WITH CHECK (church_id = get_user_church_id());

CREATE POLICY "Users can update transactions from their church" ON financial_transactions
    FOR UPDATE USING (church_id = get_user_church_id());

CREATE POLICY "Users can delete transactions from their church" ON financial_transactions
    FOR DELETE USING (church_id = get_user_church_id());

-- groups
DROP POLICY IF EXISTS "Users can view groups from their church" ON groups;
DROP POLICY IF EXISTS "Users can insert groups for their church" ON groups;
DROP POLICY IF EXISTS "Users can update groups from their church" ON groups;
DROP POLICY IF EXISTS "Users can delete groups from their church" ON groups;

CREATE POLICY "Users can view groups from their church" ON groups
    FOR SELECT USING (church_id = get_user_church_id());

CREATE POLICY "Users can insert groups for their church" ON groups
    FOR INSERT WITH CHECK (church_id = get_user_church_id());

CREATE POLICY "Users can update groups from their church" ON groups
    FOR UPDATE USING (church_id = get_user_church_id());

CREATE POLICY "Users can delete groups from their church" ON groups
    FOR DELETE USING (church_id = get_user_church_id());

-- group_members
DROP POLICY IF EXISTS "Users can view group members from their church" ON group_members;
DROP POLICY IF EXISTS "Users can insert group members for their church" ON group_members;
DROP POLICY IF EXISTS "Users can update group members from their church" ON group_members;
DROP POLICY IF EXISTS "Users can delete group members from their church" ON group_members;

CREATE POLICY "Users can view group members from their church" ON group_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM groups 
            WHERE groups.id = group_members.group_id 
            AND groups.church_id = get_user_church_id()
        )
    );

CREATE POLICY "Users can insert group members for their church" ON group_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM groups 
            WHERE groups.id = group_members.group_id 
            AND groups.church_id = get_user_church_id()
        )
    );

CREATE POLICY "Users can update group members from their church" ON group_members
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM groups 
            WHERE groups.id = group_members.group_id 
            AND groups.church_id = get_user_church_id()
        )
    );

CREATE POLICY "Users can delete group members from their church" ON group_members
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM groups 
            WHERE groups.id = group_members.group_id 
            AND groups.church_id = get_user_church_id()
        )
    );

-- group_meetings
DROP POLICY IF EXISTS "Users can view group meetings from their church" ON group_meetings;
DROP POLICY IF EXISTS "Users can insert group meetings for their church" ON group_meetings;
DROP POLICY IF EXISTS "Users can update group meetings from their church" ON group_meetings;
DROP POLICY IF EXISTS "Users can delete group meetings from their church" ON group_meetings;

CREATE POLICY "Users can view group meetings from their church" ON group_meetings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM groups 
            WHERE groups.id = group_meetings.group_id 
            AND groups.church_id = get_user_church_id()
        )
    );

CREATE POLICY "Users can insert group meetings for their church" ON group_meetings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM groups 
            WHERE groups.id = group_meetings.group_id 
            AND groups.church_id = get_user_church_id()
        )
    );

CREATE POLICY "Users can update group meetings from their church" ON group_meetings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM groups 
            WHERE groups.id = group_meetings.group_id 
            AND groups.church_id = get_user_church_id()
        )
    );

CREATE POLICY "Users can delete group meetings from their church" ON group_meetings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM groups 
            WHERE groups.id = group_meetings.group_id 
            AND groups.church_id = get_user_church_id()
        )
    );

-- group_meeting_attendance
DROP POLICY IF EXISTS "Users can view attendance from their church" ON group_meeting_attendance;
DROP POLICY IF EXISTS "Users can insert attendance for their church" ON group_meeting_attendance;
DROP POLICY IF EXISTS "Users can update attendance from their church" ON group_meeting_attendance;
DROP POLICY IF EXISTS "Users can delete attendance from their church" ON group_meeting_attendance;

CREATE POLICY "Users can view attendance from their church" ON group_meeting_attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM group_meetings gm
            JOIN groups g ON g.id = gm.group_id
            WHERE gm.id = group_meeting_attendance.meeting_id
            AND g.church_id = get_user_church_id()
        )
    );

CREATE POLICY "Users can insert attendance for their church" ON group_meeting_attendance
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM group_meetings gm
            JOIN groups g ON g.id = gm.group_id
            WHERE gm.id = group_meeting_attendance.meeting_id
            AND g.church_id = get_user_church_id()
        )
    );

CREATE POLICY "Users can update attendance from their church" ON group_meeting_attendance
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM group_meetings gm
            JOIN groups g ON g.id = gm.group_id
            WHERE gm.id = group_meeting_attendance.meeting_id
            AND g.church_id = get_user_church_id()
        )
    );

CREATE POLICY "Users can delete attendance from their church" ON group_meeting_attendance
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM group_meetings gm
            JOIN groups g ON g.id = gm.group_id
            WHERE gm.id = group_meeting_attendance.meeting_id
            AND g.church_id = get_user_church_id()
        )
    );

-- Reload PostgREST config
NOTIFY pgrst, 'reload config';
