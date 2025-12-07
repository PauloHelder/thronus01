-- Add cover_url column to events table
ALTER TABLE events ADD COLUMN cover_url TEXT;

-- Update RLS policies to ensure coverage (though existing ones should cover the new column automatically as they are table-level)
-- No changes needed to RLS for adding a column if the policies are FOR ALL or standard SELECT/INSERT/UPDATE.
