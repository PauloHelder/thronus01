-- Fix RLS Policies for Discipleship Module (Comprehensive)
-- This migration ensures that Leaders and Admins can view/manage Leaders, Meetings, and Attendance.

-- 1. Discipleship Leaders Table
DROP POLICY IF EXISTS "Discipleship Leaders View Policy" ON discipleship_leaders;
DROP POLICY IF EXISTS "Discipleship Leaders Manage Policy" ON discipleship_leaders;
-- Clean up old potentially conflicting policies
DROP POLICY IF EXISTS "Admins and Leaders can manage discipleship leaders" ON discipleship_leaders;
DROP POLICY IF EXISTS "Users can view discipleship leaders from their church" ON discipleship_leaders;

-- View: Leaders need to see themselves (and others in church for simplicity of lists)
CREATE POLICY "Discipleship Leaders View Policy"
ON discipleship_leaders FOR SELECT
USING (
  church_id = (SELECT church_id FROM users WHERE id = auth.uid() LIMIT 1)
);

-- Manage: Admins or Leaders (Leader might add themselves or others?) 
-- Ideally Admin assigns Leaders, but let's allow Leaders to manage for now based on perm
CREATE POLICY "Discipleship Leaders Manage Policy"
ON discipleship_leaders FOR ALL
USING (
  church_id = (SELECT church_id FROM users WHERE id = auth.uid() LIMIT 1)
  AND (
    (SELECT role FROM users WHERE id = auth.uid() LIMIT 1) IN ('admin', 'leader')
    OR
    (SELECT permissions FROM users WHERE id = auth.uid() LIMIT 1) @> '"manage_discipleship"'
  )
);


-- 2. Discipleship Meetings Table
DROP POLICY IF EXISTS "Discipleship Meetings View Policy" ON discipleship_meetings;
DROP POLICY IF EXISTS "Discipleship Meetings Manage Policy" ON discipleship_meetings;
DROP POLICY IF EXISTS "Users can view meetings from their church" ON discipleship_meetings;
DROP POLICY IF EXISTS "Admins and Leaders can manage meetings" ON discipleship_meetings;

-- View: Same Church
CREATE POLICY "Discipleship Meetings View Policy"
ON discipleship_meetings FOR SELECT
USING (
   EXISTS (
    SELECT 1 FROM discipleship_leaders
    WHERE discipleship_leaders.id = discipleship_meetings.leader_id
    AND discipleship_leaders.church_id = (SELECT church_id FROM users WHERE id = auth.uid() LIMIT 1)
   )
);

-- Manage: Admin or Leader
CREATE POLICY "Discipleship Meetings Manage Policy"
ON discipleship_meetings FOR ALL
USING (
   EXISTS (
    SELECT 1 FROM discipleship_leaders
    WHERE discipleship_leaders.id = discipleship_meetings.leader_id
    AND discipleship_leaders.church_id = (SELECT church_id FROM users WHERE id = auth.uid() LIMIT 1)
  )
  AND (
    (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) IN ('admin', 'leader')
    OR
    (SELECT permissions FROM public.users WHERE id = auth.uid() LIMIT 1) @> '"manage_discipleship"'
  )
);


-- 3. Discipleship Attendance Table
DROP POLICY IF EXISTS "Discipleship Attendance View Policy" ON discipleship_meeting_attendance;
DROP POLICY IF EXISTS "Discipleship Attendance Manage Policy" ON discipleship_meeting_attendance;
DROP POLICY IF EXISTS "Users can view meeting attendance" ON discipleship_meeting_attendance;
DROP POLICY IF EXISTS "Admins and Leaders can manage meeting attendance" ON discipleship_meeting_attendance;

-- View: Same Church
CREATE POLICY "Discipleship Attendance View Policy"
ON discipleship_meeting_attendance FOR SELECT
USING (
   EXISTS (
    SELECT 1 FROM discipleship_meetings
    JOIN discipleship_leaders ON discipleship_leaders.id = discipleship_meetings.leader_id
    WHERE discipleship_meetings.id = discipleship_meeting_attendance.meeting_id
    AND discipleship_leaders.church_id = (SELECT church_id FROM users WHERE id = auth.uid() LIMIT 1)
   )
);

-- Manage: Admin or Leader
CREATE POLICY "Discipleship Attendance Manage Policy"
ON discipleship_meeting_attendance FOR ALL
USING (
   EXISTS (
    SELECT 1 FROM discipleship_meetings
    JOIN discipleship_leaders ON discipleship_leaders.id = discipleship_meetings.leader_id
    WHERE discipleship_meetings.id = discipleship_meeting_attendance.meeting_id
    AND discipleship_leaders.church_id = (SELECT church_id FROM users WHERE id = auth.uid() LIMIT 1)
   )
  AND (
    (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) IN ('admin', 'leader')
    OR
    (SELECT permissions FROM public.users WHERE id = auth.uid() LIMIT 1) @> '"manage_discipleship"'
  )
);
