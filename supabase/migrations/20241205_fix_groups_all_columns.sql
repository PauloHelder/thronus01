-- =====================================================
-- FIX: Add ALL missing columns to groups table
-- Execute este script para corrigir erros PGRST204 (type, location, etc)
-- =====================================================

DO $$ 
BEGIN
    -- 1. Coluna TYPE
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'type') THEN
        ALTER TABLE groups ADD COLUMN type VARCHAR(100) DEFAULT 'Célula';
    END IF;

    -- 2. Coluna LOCATION
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'location') THEN
        ALTER TABLE groups ADD COLUMN location TEXT;
    END IF;

    -- 3. Coluna MEETING_DAY
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'meeting_day') THEN
        ALTER TABLE groups ADD COLUMN meeting_day VARCHAR(50);
    END IF;

    -- 4. Coluna MEETING_TIME
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'meeting_time') THEN
        ALTER TABLE groups ADD COLUMN meeting_time TIME; -- Ou VARCHAR se preferir flexibilidade
    END IF;

    -- 5. Coluna DESCRIPTION
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'description') THEN
        ALTER TABLE groups ADD COLUMN description TEXT;
    END IF;

    -- 6. Coluna ADDRESS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'address') THEN
        ALTER TABLE groups ADD COLUMN address TEXT;
    END IF;

    -- 7. Coluna NEIGHBORHOOD
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'neighborhood') THEN
        ALTER TABLE groups ADD COLUMN neighborhood VARCHAR(255);
    END IF;

    -- 8. Coluna DISTRICT
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'district') THEN
        ALTER TABLE groups ADD COLUMN district VARCHAR(255);
    END IF;

    -- 9. Coluna PROVINCE
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'province') THEN
        ALTER TABLE groups ADD COLUMN province VARCHAR(255);
    END IF;

    -- 10. Coluna COUNTRY
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'country') THEN
        ALTER TABLE groups ADD COLUMN country VARCHAR(100) DEFAULT 'Angola';
    END IF;

    -- 11. Coluna MUNICIPALITY
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'municipality') THEN
        ALTER TABLE groups ADD COLUMN municipality VARCHAR(255);
    END IF;

    -- Recarrega o cache do schema
    NOTIFY pgrst, 'reload schema';
END $$;
