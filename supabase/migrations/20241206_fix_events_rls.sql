-- RLS Policies for Events and Attendees
-- ensure RLS is enabled
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view events from their church" ON events;
DROP POLICY IF EXISTS "Users can manage events" ON events;
DROP POLICY IF EXISTS "Service role bypass" ON events;

DROP POLICY IF EXISTS "Users can view event attendees" ON event_attendees;
DROP POLICY IF EXISTS "Users can manage event attendees" ON event_attendees;
DROP POLICY IF EXISTS "Service role bypass" ON event_attendees;

-- Events Policies
CREATE POLICY "Users can view events from their church"
ON events FOR SELECT
USING (
  church_id = (SELECT church_id FROM users WHERE id = auth.uid() LIMIT 1)
  AND (deleted_at IS NULL OR deleted_at > NOW())
);

CREATE POLICY "Users can manage events"
ON events FOR ALL
USING (
  church_id = (SELECT church_id FROM users WHERE id = auth.uid() LIMIT 1)
  AND (
    (SELECT role FROM users WHERE id = auth.uid() LIMIT 1) = 'admin' 
    OR 
    (SELECT permissions FROM users WHERE id = auth.uid() LIMIT 1)  @> '"manage_events"'
    OR
    (SELECT permissions FROM users WHERE id = auth.uid() LIMIT 1) ? 'manage_events'
  )
);

-- Event Attendees Policies
CREATE POLICY "Users can view event attendees"
ON event_attendees FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = event_attendees.event_id 
    AND events.church_id = (SELECT church_id FROM users WHERE id = auth.uid() LIMIT 1)
  )
);

CREATE POLICY "Users can manage event attendees"
ON event_attendees FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = event_attendees.event_id 
    AND events.church_id = (SELECT church_id FROM users WHERE id = auth.uid() LIMIT 1)
  )
  AND (
    (SELECT role FROM users WHERE id = auth.uid() LIMIT 1) = 'admin' 
    OR 
    (SELECT permissions FROM users WHERE id = auth.uid() LIMIT 1) @> '"manage_events"'
    OR
    (SELECT permissions FROM users WHERE id = auth.uid() LIMIT 1) ? 'manage_events'
  )
);

-- Service Role Bypass
CREATE POLICY "Service role bypass" ON events FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role bypass" ON event_attendees FOR ALL USING (auth.jwt()->>'role' = 'service_role');
