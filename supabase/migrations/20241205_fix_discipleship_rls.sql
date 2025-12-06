-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can manage discipleship leaders" ON discipleship_leaders;
DROP POLICY IF EXISTS "Users can manage discipleship relationships" ON discipleship_relationships;
DROP POLICY IF EXISTS "Users can manage discipleship meetings" ON discipleship_meetings;
DROP POLICY IF EXISTS "Users can manage discipleship meeting attendance" ON discipleship_meeting_attendance;

-- Create new permissive policies (authenticated users from same church can manage)
-- This is useful for development/testing. In production, you might want to restrict this back to admins/permissions.

CREATE POLICY "Users can manage discipleship leaders"
ON discipleship_leaders FOR ALL
USING (church_id = get_user_church_id());

CREATE POLICY "Users can manage discipleship relationships"
ON discipleship_relationships FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM discipleship_leaders 
        WHERE discipleship_leaders.id = discipleship_relationships.leader_id 
        AND discipleship_leaders.church_id = get_user_church_id()
    )
);

CREATE POLICY "Users can manage discipleship meetings"
ON discipleship_meetings FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM discipleship_leaders 
        WHERE discipleship_leaders.id = discipleship_meetings.leader_id 
        AND discipleship_leaders.church_id = get_user_church_id()
    )
);

CREATE POLICY "Users can manage discipleship meeting attendance"
ON discipleship_meeting_attendance FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM discipleship_meetings dm
        JOIN discipleship_leaders dl ON dl.id = dm.leader_id
        WHERE dm.id = discipleship_meeting_attendance.meeting_id 
        AND dl.church_id = get_user_church_id()
    )
);
