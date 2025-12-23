-- Add text columns for preacher and leader to support entering names directly
-- This allows for visiting preachers or simple text entry as currently implemented in the frontend.

ALTER TABLE services 
ADD COLUMN IF NOT EXISTS preacher_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS leader_name VARCHAR(255);

-- Migration to copy any existing data if we had joined it (unlikely given the code state)
-- but useful if we want to preserve IDs as text for now.
-- UPDATE services SET preacher_name = (SELECT name FROM members WHERE id = services.preacher_id) WHERE preacher_id IS NOT NULL;
-- UPDATE services SET leader_name = (SELECT name FROM members WHERE id = services.leader_id) WHERE leader_id IS NOT NULL;
