-- Create event_types table
CREATE TABLE IF NOT EXISTS event_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(50) DEFAULT 'bg-gray-100 text-gray-700',
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;

-- Policies for event_types
CREATE POLICY "Users can view event types from their church"
    ON event_types FOR SELECT
    USING (church_id = (SELECT church_id FROM users WHERE id = auth.uid() LIMIT 1));

CREATE POLICY "Admins and Leaders can manage event types"
    ON event_types FOR ALL
    USING (
        church_id = (SELECT church_id FROM users WHERE id = auth.uid() LIMIT 1)
        AND (
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'leader'))
        )
    );

-- Add cover_url column to events if not exists (Idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'cover_url') THEN
        ALTER TABLE events ADD COLUMN cover_url TEXT;
    END IF;
END $$;

-- Drop check constraint on events.type if exists to allow dynamic types
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE table_name = 'events' AND constraint_name = 'events_type_check') THEN
        ALTER TABLE events DROP CONSTRAINT events_type_check;
    END IF;
END $$;

-- Insert default event types for existing churches (optional, can be done on demand or trigger)
-- For now, we rely on the FE to show defaults if list is empty or seeding.
-- Let's insert defaults for the current user's church if we can determine it, but hard in SQL script without context.
-- Instead, we will handle defaults in the UI or a separate seed script.
