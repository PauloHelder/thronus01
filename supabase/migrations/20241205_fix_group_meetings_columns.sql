-- =====================================================
-- FIX: Add missing columns to group_meetings table
-- Execute este script para corrigir erro PGRST204 em group_meetings
-- =====================================================

DO $$ 
BEGIN
    -- 1. Coluna START_TIME
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_meetings' AND column_name = 'start_time') THEN
        ALTER TABLE group_meetings ADD COLUMN start_time TIME;
    END IF;

    -- 2. Coluna END_TIME
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_meetings' AND column_name = 'end_time') THEN
        ALTER TABLE group_meetings ADD COLUMN end_time TIME;
    END IF;

    -- 3. Coluna TOPIC
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_meetings' AND column_name = 'topic') THEN
        ALTER TABLE group_meetings ADD COLUMN topic TEXT;
    END IF;

    -- 4. Coluna NOTES
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_meetings' AND column_name = 'notes') THEN
        ALTER TABLE group_meetings ADD COLUMN notes TEXT;
    END IF;

    -- 5. Coluna DATE (Garantir que existe)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_meetings' AND column_name = 'date') THEN
        ALTER TABLE group_meetings ADD COLUMN date DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;

    -- Recarrega o cache do schema
    NOTIFY pgrst, 'reload schema';
END $$;
