-- FORCE FIX DISCIPLESHIP RLS & PERMISSIONS (Idempotent Version)
-- Run this in Supabase SQL Editor

-- 1. Ensure RLS is enabled
ALTER TABLE discipleship_leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE discipleship_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE discipleship_meeting_attendance ENABLE ROW LEVEL SECURITY;

-- 2. Grant Permissions to Authenticated Roles
GRANT ALL ON discipleship_leaders TO authenticated;
GRANT ALL ON discipleship_meetings TO authenticated;
GRANT ALL ON discipleship_meeting_attendance TO authenticated;

-- 3. DROP ALL EXISTING POLICIES (Clean Slate)
-- Explicitly drop the ones causing conflicts
DROP POLICY IF EXISTS "Discipleship Leaders access" ON discipleship_leaders;
DROP POLICY IF EXISTS "Discipleship Meetings access" ON discipleship_meetings;
DROP POLICY IF EXISTS "Discipleship Attendance access" ON discipleship_meeting_attendance;

-- Drop older versions/names just in case
DROP POLICY IF EXISTS "Discipleship Leaders View Policy" ON discipleship_leaders;
DROP POLICY IF EXISTS "Discipleship Leaders Manage Policy" ON discipleship_leaders;
DROP POLICY IF EXISTS "Discipleship Meetings View Policy" ON discipleship_meetings;
DROP POLICY IF EXISTS "Discipleship Meetings Manage Policy" ON discipleship_meetings;
DROP POLICY IF EXISTS "Discipleship Attendance View Policy" ON discipleship_meeting_attendance;
DROP POLICY IF EXISTS "Discipleship Attendance Manage Policy" ON discipleship_meeting_attendance;

-- 4. RECREATE POLICIES (Correct Logic)

-- LEADERS
CREATE POLICY "Discipleship Leaders access"
ON discipleship_leaders FOR ALL
USING (
  church_id = (SELECT church_id FROM users WHERE id = auth.uid() LIMIT 1)
);

-- MEETINGS
CREATE POLICY "Discipleship Meetings access"
ON discipleship_meetings FOR ALL
USING (
   EXISTS (
    SELECT 1 FROM discipleship_leaders
    WHERE discipleship_leaders.id = discipleship_meetings.leader_id
    AND discipleship_leaders.church_id = (SELECT church_id FROM users WHERE id = auth.uid() LIMIT 1)
  )
);

-- ATTENDANCE
CREATE POLICY "Discipleship Attendance access"
ON discipleship_meeting_attendance FOR ALL
USING (
   EXISTS (
    SELECT 1 FROM discipleship_meetings
    JOIN discipleship_leaders ON discipleship_leaders.id = discipleship_meetings.leader_id
    WHERE discipleship_meetings.id = discipleship_meeting_attendance.meeting_id
    AND discipleship_leaders.church_id = (SELECT church_id FROM users WHERE id = auth.uid() LIMIT 1)
   )
);
