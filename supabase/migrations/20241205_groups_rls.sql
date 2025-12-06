-- =====================================================
-- GROUPS MODULE - Row Level Security Policies
-- Remove políticas antigas e cria novas
-- =====================================================

-- =====================================================
-- DROP existing policies
-- =====================================================
DROP POLICY IF EXISTS "Users can view groups from their church" ON groups;
DROP POLICY IF EXISTS "Users can insert groups for their church" ON groups;
DROP POLICY IF EXISTS "Users can update groups from their church" ON groups;
DROP POLICY IF EXISTS "Users can delete groups from their church" ON groups;

DROP POLICY IF EXISTS "Users can view group members from their church" ON group_members;
DROP POLICY IF EXISTS "Users can insert group members for their church" ON group_members;
DROP POLICY IF EXISTS "Users can update group members from their church" ON group_members;
DROP POLICY IF EXISTS "Users can delete group members from their church" ON group_members;

DROP POLICY IF EXISTS "Users can view group meetings from their church" ON group_meetings;
DROP POLICY IF EXISTS "Users can insert group meetings for their church" ON group_meetings;
DROP POLICY IF EXISTS "Users can update group meetings from their church" ON group_meetings;
DROP POLICY IF EXISTS "Users can delete group meetings from their church" ON group_meetings;

DROP POLICY IF EXISTS "Users can view attendance from their church" ON group_meeting_attendance;
DROP POLICY IF EXISTS "Users can insert attendance for their church" ON group_meeting_attendance;
DROP POLICY IF EXISTS "Users can update attendance from their church" ON group_meeting_attendance;
DROP POLICY IF EXISTS "Users can delete attendance from their church" ON group_meeting_attendance;

-- =====================================================
-- RLS for groups table
-- =====================================================
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view groups from their church
CREATE POLICY "Users can view groups from their church"
ON groups
FOR SELECT
USING (
    church_id IN (
        SELECT church_id FROM users WHERE id = auth.uid()
    )
);

-- Policy: Users can insert groups for their church
CREATE POLICY "Users can insert groups for their church"
ON groups
FOR INSERT
WITH CHECK (
    church_id IN (
        SELECT church_id FROM users WHERE id = auth.uid()
    )
);

-- Policy: Users can update groups from their church
CREATE POLICY "Users can update groups from their church"
ON groups
FOR UPDATE
USING (
    church_id IN (
        SELECT church_id FROM users WHERE id = auth.uid()
    )
)
WITH CHECK (
    church_id IN (
        SELECT church_id FROM users WHERE id = auth.uid()
    )
);

-- Policy: Users can delete groups from their church
CREATE POLICY "Users can delete groups from their church"
ON groups
FOR DELETE
USING (
    church_id IN (
        SELECT church_id FROM users WHERE id = auth.uid()
    )
);

-- =====================================================
-- RLS for group_members table
-- =====================================================
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view group members from their church
CREATE POLICY "Users can view group members from their church"
ON group_members
FOR SELECT
USING (
    group_id IN (
        SELECT id FROM groups WHERE church_id IN (
            SELECT church_id FROM users WHERE id = auth.uid()
        )
    )
);

-- Policy: Users can insert group members for their church
CREATE POLICY "Users can insert group members for their church"
ON group_members
FOR INSERT
WITH CHECK (
    group_id IN (
        SELECT id FROM groups WHERE church_id IN (
            SELECT church_id FROM users WHERE id = auth.uid()
        )
    )
);

-- Policy: Users can update group members from their church
CREATE POLICY "Users can update group members from their church"
ON group_members
FOR UPDATE
USING (
    group_id IN (
        SELECT id FROM groups WHERE church_id IN (
            SELECT church_id FROM users WHERE id = auth.uid()
        )
    )
);

-- Policy: Users can delete group members from their church
CREATE POLICY "Users can delete group members from their church"
ON group_members
FOR DELETE
USING (
    group_id IN (
        SELECT id FROM groups WHERE church_id IN (
            SELECT church_id FROM users WHERE id = auth.uid()
        )
    )
);

-- =====================================================
-- RLS for group_meetings table
-- =====================================================
ALTER TABLE group_meetings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view group meetings from their church
CREATE POLICY "Users can view group meetings from their church"
ON group_meetings
FOR SELECT
USING (
    group_id IN (
        SELECT id FROM groups WHERE church_id IN (
            SELECT church_id FROM users WHERE id = auth.uid()
        )
    )
);

-- Policy: Users can insert group meetings for their church
CREATE POLICY "Users can insert group meetings for their church"
ON group_meetings
FOR INSERT
WITH CHECK (
    group_id IN (
        SELECT id FROM groups WHERE church_id IN (
            SELECT church_id FROM users WHERE id = auth.uid()
        )
    )
);

-- Policy: Users can update group meetings from their church
CREATE POLICY "Users can update group meetings from their church"
ON group_meetings
FOR UPDATE
USING (
    group_id IN (
        SELECT id FROM groups WHERE church_id IN (
            SELECT church_id FROM users WHERE id = auth.uid()
        )
    )
);

-- Policy: Users can delete group meetings from their church
CREATE POLICY "Users can delete group meetings from their church"
ON group_meetings
FOR DELETE
USING (
    group_id IN (
        SELECT id FROM groups WHERE church_id IN (
            SELECT church_id FROM users WHERE id = auth.uid()
        )
    )
);

-- =====================================================
-- RLS for group_meeting_attendance table
-- =====================================================
ALTER TABLE group_meeting_attendance ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view attendance from their church
CREATE POLICY "Users can view attendance from their church"
ON group_meeting_attendance
FOR SELECT
USING (
    meeting_id IN (
        SELECT id FROM group_meetings WHERE group_id IN (
            SELECT id FROM groups WHERE church_id IN (
                SELECT church_id FROM users WHERE id = auth.uid()
            )
        )
    )
);

-- Policy: Users can insert attendance for their church
CREATE POLICY "Users can insert attendance for their church"
ON group_meeting_attendance
FOR INSERT
WITH CHECK (
    meeting_id IN (
        SELECT id FROM group_meetings WHERE group_id IN (
            SELECT id FROM groups WHERE church_id IN (
                SELECT church_id FROM users WHERE id = auth.uid()
            )
        )
    )
);

-- Policy: Users can update attendance from their church
CREATE POLICY "Users can update attendance from their church"
ON group_meeting_attendance
FOR UPDATE
USING (
    meeting_id IN (
        SELECT id FROM group_meetings WHERE group_id IN (
            SELECT id FROM groups WHERE church_id IN (
                SELECT church_id FROM users WHERE id = auth.uid()
            )
        )
    )
);

-- Policy: Users can delete attendance from their church
CREATE POLICY "Users can delete attendance from their church"
ON group_meeting_attendance
FOR DELETE
USING (
    meeting_id IN (
        SELECT id FROM group_meetings WHERE group_id IN (
            SELECT id FROM groups WHERE church_id IN (
                SELECT church_id FROM users WHERE id = auth.uid()
            )
        )
    )
);
