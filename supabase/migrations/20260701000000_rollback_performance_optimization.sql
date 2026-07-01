-- =====================================================
-- THRONUS ROLLBACK - REVERT PERFORMANCE OPTIMIZATION
-- Restores all functions and RLS policies to their original states.
-- =====================================================

-- 1. REVERT FINANCE MODULE POLICIES
DROP POLICY IF EXISTS "Users can view accounts from their church" ON financial_accounts;
DROP POLICY IF EXISTS "Users can insert accounts for their church" ON financial_accounts;
DROP POLICY IF EXISTS "Users can update accounts from their church" ON financial_accounts;
DROP POLICY IF EXISTS "Users can delete accounts from their church" ON financial_accounts;

CREATE POLICY "Users can view accounts from their church" ON financial_accounts
    FOR SELECT USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert accounts for their church" ON financial_accounts
    FOR INSERT WITH CHECK (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update accounts from their church" ON financial_accounts
    FOR UPDATE USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete accounts from their church" ON financial_accounts
    FOR DELETE USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can view categories from their church" ON financial_categories;
DROP POLICY IF EXISTS "Users can insert categories for their church" ON financial_categories;
DROP POLICY IF EXISTS "Users can update categories from their church" ON financial_categories;
DROP POLICY IF EXISTS "Users can delete categories from their church" ON financial_categories;

CREATE POLICY "Users can view categories from their church" ON financial_categories
    FOR SELECT USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert categories for their church" ON financial_categories
    FOR INSERT WITH CHECK (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update categories from their church" ON financial_categories
    FOR UPDATE USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete categories from their church" ON financial_categories
    FOR DELETE USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can view transactions from their church" ON financial_transactions;
DROP POLICY IF EXISTS "Users can insert transactions for their church" ON financial_transactions;
DROP POLICY IF EXISTS "Users can update transactions from their church" ON financial_transactions;
DROP POLICY IF EXISTS "Users can delete transactions from their church" ON financial_transactions;

CREATE POLICY "Users can view transactions from their church" ON financial_transactions
    FOR SELECT USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert transactions for their church" ON financial_transactions
    FOR INSERT WITH CHECK (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update transactions from their church" ON financial_transactions
    FOR UPDATE USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete transactions from their church" ON financial_transactions
    FOR DELETE USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

-- 2. REVERT GROUPS MODULE POLICIES
DROP POLICY IF EXISTS "Users can view groups from their church" ON groups;
DROP POLICY IF EXISTS "Users can insert groups for their church" ON groups;
DROP POLICY IF EXISTS "Users can update groups from their church" ON groups;
DROP POLICY IF EXISTS "Users can delete groups from their church" ON groups;

CREATE POLICY "Users can view groups from their church" ON groups
    FOR SELECT USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert groups for their church" ON groups
    FOR INSERT WITH CHECK (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update groups from their church" ON groups
    FOR UPDATE USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()))
    WITH CHECK (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete groups from their church" ON groups
    FOR DELETE USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can view group members from their church" ON group_members;
DROP POLICY IF EXISTS "Users can insert group members for their church" ON group_members;
DROP POLICY IF EXISTS "Users can update group members from their church" ON group_members;
DROP POLICY IF EXISTS "Users can delete group members from their church" ON group_members;

CREATE POLICY "Users can view group members from their church" ON group_members
    FOR SELECT USING (group_id IN (SELECT id FROM groups WHERE church_id IN (SELECT church_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Users can insert group members for their church" ON group_members
    FOR INSERT WITH CHECK (group_id IN (SELECT id FROM groups WHERE church_id IN (SELECT church_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Users can update group members from their church" ON group_members
    FOR UPDATE USING (group_id IN (SELECT id FROM groups WHERE church_id IN (SELECT church_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Users can delete group members from their church" ON group_members
    FOR DELETE USING (group_id IN (SELECT id FROM groups WHERE church_id IN (SELECT church_id FROM users WHERE id = auth.uid())));

DROP POLICY IF EXISTS "Users can view group meetings from their church" ON group_meetings;
DROP POLICY IF EXISTS "Users can insert group meetings for their church" ON group_meetings;
DROP POLICY IF EXISTS "Users can update group meetings from their church" ON group_meetings;
DROP POLICY IF EXISTS "Users can delete group meetings from their church" ON group_meetings;

CREATE POLICY "Users can view group meetings from their church" ON group_meetings
    FOR SELECT USING (group_id IN (SELECT id FROM groups WHERE church_id IN (SELECT church_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Users can insert group meetings for their church" ON group_meetings
    FOR INSERT WITH CHECK (group_id IN (SELECT id FROM groups WHERE church_id IN (SELECT church_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Users can update group meetings from their church" ON group_meetings
    FOR UPDATE USING (group_id IN (SELECT id FROM groups WHERE church_id IN (SELECT church_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Users can delete group meetings from their church" ON group_meetings
    FOR DELETE USING (group_id IN (SELECT id FROM groups WHERE church_id IN (SELECT church_id FROM users WHERE id = auth.uid())));

DROP POLICY IF EXISTS "Users can view attendance from their church" ON group_meeting_attendance;
DROP POLICY IF EXISTS "Users can insert attendance for their church" ON group_meeting_attendance;
DROP POLICY IF EXISTS "Users can update attendance from their church" ON group_meeting_attendance;
DROP POLICY IF EXISTS "Users can delete attendance from their church" ON group_meeting_attendance;

CREATE POLICY "Users can view attendance from their church" ON group_meeting_attendance
    FOR SELECT USING (meeting_id IN (SELECT id FROM group_meetings WHERE group_id IN (SELECT id FROM groups WHERE church_id IN (SELECT church_id FROM users WHERE id = auth.uid()))));

CREATE POLICY "Users can insert attendance for their church" ON group_meeting_attendance
    FOR INSERT WITH CHECK (meeting_id IN (SELECT id FROM group_meetings WHERE group_id IN (SELECT id FROM groups WHERE church_id IN (SELECT church_id FROM users WHERE id = auth.uid()))));

CREATE POLICY "Users can update attendance from their church" ON group_meeting_attendance
    FOR UPDATE USING (meeting_id IN (SELECT id FROM group_meetings WHERE group_id IN (SELECT id FROM groups WHERE church_id IN (SELECT church_id FROM users WHERE id = auth.uid()))));

CREATE POLICY "Users can delete attendance from their church" ON group_meeting_attendance
    FOR DELETE USING (meeting_id IN (SELECT id FROM group_meetings WHERE group_id IN (SELECT id FROM groups WHERE church_id IN (SELECT church_id FROM users WHERE id = auth.uid()))));

-- 3. REVERT HELPER FUNCTIONS TO ORIGINAL NON-STABLE VERSIONS
CREATE OR REPLACE FUNCTION public.get_user_church_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT church_id 
        FROM public.users 
        WHERE id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.user_has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT 
            CASE 
                WHEN role = 'admin' THEN true
                WHEN permissions ? permission_name THEN (permissions->permission_name)::boolean
                ELSE false
            END
        FROM public.users
        WHERE id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = 'admin'
        FROM public.users
        WHERE id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.user_has_department_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND (
      role IN ('admin', 'supervisor', 'leader')
      OR
      permissions ? 'manage_departments'
      OR
      permissions ? 'departments_create'
      OR
      permissions ? 'departments_edit'
    )
  );
END;
$$;

-- Reload PostgREST config
NOTIFY pgrst, 'reload config';
