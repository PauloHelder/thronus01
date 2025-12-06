-- Temporarily allow all authenticated users to manage attendance to debug RLS issue
DROP POLICY IF EXISTS "Users can manage discipleship meeting attendance" ON discipleship_meeting_attendance;

CREATE POLICY "Debug: Allow all authenticated for attendance"
ON discipleship_meeting_attendance FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
