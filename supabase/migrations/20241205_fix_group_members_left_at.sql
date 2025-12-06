-- =====================================================
-- FIX: Add left_at column to group_members if it doesn't exist
-- Execute este script ANTES do script principal
-- =====================================================

-- Add left_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'group_members' 
        AND column_name = 'left_at'
    ) THEN
        ALTER TABLE group_members 
        ADD COLUMN left_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Now create the unique index
DROP INDEX IF EXISTS idx_unique_active_group_member;
CREATE UNIQUE INDEX idx_unique_active_group_member 
ON group_members(group_id, member_id) 
WHERE left_at IS NULL;
