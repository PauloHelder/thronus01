-- =====================================================
-- FIX: Sync Group Leaders to Members (Robust Version)
-- 1. Remove constraints conflitantes
-- 2. Garante índice parcial correto
-- 3. Sincroniza líderes
-- =====================================================

DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- 1. Remove constraints antigas que podem estar causando conflito
    -- (O nome da constraint no erro foi group_members_group_id_member_id_key)
    BEGIN
        ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_group_id_member_id_key;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignora erro se não existir
    END;

    -- 2. Garante que o índice parcial correto existe
    -- (Isso permite reentrar no grupo se left_at não for nulo)
    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_group_member 
    ON group_members(group_id, member_id) 
    WHERE left_at IS NULL;

    -- 3. Loop para sincronizar líderes
    FOR r IN SELECT * FROM groups WHERE deleted_at IS NULL LOOP
        
        -- Inserir Líder
        IF r.leader_id IS NOT NULL THEN
            -- Verifica se já existe ATIVO
            IF NOT EXISTS (
                SELECT 1 FROM group_members 
                WHERE group_id = r.id AND member_id = r.leader_id AND left_at IS NULL
            ) THEN
                INSERT INTO group_members (group_id, member_id, role)
                VALUES (r.id, r.leader_id, 'Líder');
            ELSE
                -- Se já existe, garante que o role está correto
                UPDATE group_members 
                SET role = 'Líder' 
                WHERE group_id = r.id AND member_id = r.leader_id AND left_at IS NULL;
            END IF;
        END IF;

        -- Inserir Co-líder
        IF r.co_leader_id IS NOT NULL THEN
            -- Verifica se já existe ATIVO
            IF NOT EXISTS (
                SELECT 1 FROM group_members 
                WHERE group_id = r.id AND member_id = r.co_leader_id AND left_at IS NULL
            ) THEN
                INSERT INTO group_members (group_id, member_id, role)
                VALUES (r.id, r.co_leader_id, 'Co-líder');
            ELSE
                -- Se já existe, garante que o role está correto
                UPDATE group_members 
                SET role = 'Co-líder' 
                WHERE group_id = r.id AND member_id = r.co_leader_id AND left_at IS NULL;
            END IF;
        END IF;

    END LOOP;
END $$;
