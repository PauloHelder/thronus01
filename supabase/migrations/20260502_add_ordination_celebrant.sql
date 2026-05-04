-- Add ordination_celebrant column to members
ALTER TABLE members ADD COLUMN IF NOT EXISTS ordination_celebrant TEXT;
