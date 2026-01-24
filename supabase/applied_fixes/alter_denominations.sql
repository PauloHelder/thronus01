-- Add optional columns to denominations table
ALTER TABLE denominations
ADD COLUMN IF NOT EXISTS acronym TEXT,
ADD COLUMN IF NOT EXISTS doctrinal_current TEXT,
ADD COLUMN IF NOT EXISTS max_leader TEXT,
ADD COLUMN IF NOT EXISTS recognition_year INTEGER;
