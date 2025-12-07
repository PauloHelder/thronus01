-- Fix RLS Policies for Events
-- 1. Drop ALL potential existing policies to ensure clean slate (idempotency fix)
DROP POLICY IF EXISTS "Users can manage events" ON events;
DROP POLICY IF EXISTS "Admins and Leaders can manage events" ON events;
DROP POLICY IF EXISTS "Users can view events from their church" ON events;
DROP POLICY IF EXISTS "Service role bypass" ON events;
DROP POLICY IF EXISTS "Service role bypass events" ON events;

-- 2. Create correct policies for events
CREATE POLICY "Users can view events from their church"
ON events FOR SELECT
USING (
  church_id = (SELECT church_id FROM users WHERE id = auth.uid() LIMIT 1)
  AND (deleted_at IS NULL OR deleted_at > NOW())
);

CREATE POLICY "Admins and Leaders can manage events"
ON events FOR ALL
USING (
  church_id = (SELECT church_id FROM users WHERE id = auth.uid() LIMIT 1)
  AND (
    (SELECT role FROM users WHERE id = auth.uid() LIMIT 1) IN ('admin', 'leader')
    OR 
    (SELECT permissions FROM users WHERE id = auth.uid() LIMIT 1) @> '"manage_events"'
  )
);

-- 3. Drop ALL potential existing policies for attendees
DROP POLICY IF EXISTS "Users can manage event attendees" ON event_attendees;
DROP POLICY IF EXISTS "Admins and Leaders can manage event attendees" ON event_attendees;
DROP POLICY IF EXISTS "Users can view event attendees" ON event_attendees;
DROP POLICY IF EXISTS "Service role bypass" ON event_attendees;
DROP POLICY IF EXISTS "Service role bypass attendees" ON event_attendees;

CREATE POLICY "Users can view event attendees"
ON event_attendees FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = event_attendees.event_id 
    AND events.church_id = (SELECT church_id FROM users WHERE id = auth.uid() LIMIT 1)
  )
);

CREATE POLICY "Admins and Leaders can manage event attendees"
ON event_attendees FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = event_attendees.event_id 
    AND events.church_id = (SELECT church_id FROM users WHERE id = auth.uid() LIMIT 1)
  )
  AND (
    (SELECT role FROM users WHERE id = auth.uid() LIMIT 1) IN ('admin', 'leader')
    OR 
    (SELECT permissions FROM users WHERE id = auth.uid() LIMIT 1) @> '"manage_events"'
  )
);

-- Service Role Bypass
CREATE POLICY "Service role bypass events" ON events FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role bypass attendees" ON event_attendees FOR ALL USING (auth.jwt()->>'role' = 'service_role');
