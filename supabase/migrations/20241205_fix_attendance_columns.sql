-- =====================================================
-- FIX: Add missing columns to group_meeting_attendance table
-- Execute este script para corrigir erro PGRST204 em group_meeting_attendance
-- =====================================================

DO $$ 
BEGIN
    -- 1. Coluna STATUS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_meeting_attendance' AND column_name = 'status') THEN
        ALTER TABLE group_meeting_attendance ADD COLUMN status VARCHAR(50) DEFAULT 'Presente';
    END IF;

    -- 2. Coluna NOTES (se necessário)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_meeting_attendance' AND column_name = 'notes') THEN
        ALTER TABLE group_meeting_attendance ADD COLUMN notes TEXT;
    END IF;

    -- Recarrega o cache do schema
    NOTIFY pgrst, 'reload schema';
END $$;
