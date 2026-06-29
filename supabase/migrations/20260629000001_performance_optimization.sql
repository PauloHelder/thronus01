-- =====================================================
-- THRONUS PERFORMANCE OPTIMIZATION - RLS CACHING & TUNING
-- =====================================================

-- 1. REDEFINE HELPER FUNCTIONS WITH "STABLE" AND "SECURITY DEFINER"
-- Marking these as STABLE allows PostgreSQL to cache the returned value for the query duration,
-- changing RLS evaluation overhead from O(N) internal queries to O(1) query.

CREATE OR REPLACE FUNCTION public.get_user_church_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_church_id UUID;
BEGIN
    SELECT church_id INTO v_church_id
    FROM public.users
    WHERE id = auth.uid()
    LIMIT 1;
    RETURN v_church_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.user_has_permission(permission_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_has_permission BOOLEAN;
BEGIN
    SELECT 
        CASE 
            WHEN role = 'admin' THEN true
            WHEN permissions ? permission_name THEN (permissions->permission_name)::boolean
            ELSE false
        END INTO v_has_permission
    FROM public.users
    WHERE id = auth.uid()
    LIMIT 1;
    RETURN COALESCE(v_has_permission, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    SELECT role = 'admin' INTO v_is_admin
    FROM public.users
    WHERE id = auth.uid()
    LIMIT 1;
    RETURN COALESCE(v_is_admin, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.user_has_department_access()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_access boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND (
      role IN ('admin', 'supervisor', 'leader')
      OR permissions ? 'manage_departments'
      OR permissions ? 'departments_create'
      OR permissions ? 'departments_edit'
    )
  ) INTO v_access;
  RETURN v_access;
END;
$$;

-- 2. RECREATE FINANCE RLS POLICIES USING CACHED CHURCH ID (NO INLINE SUBQUERIES)

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

-- 3. RECREATE GROUPS RLS POLICIES USING CACHED CHURCH ID (NO INLINE SUBQUERIES)

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
