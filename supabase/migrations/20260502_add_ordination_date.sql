-- Add ordination_date column to members
ALTER TABLE members ADD COLUMN IF NOT EXISTS ordination_date DATE;
