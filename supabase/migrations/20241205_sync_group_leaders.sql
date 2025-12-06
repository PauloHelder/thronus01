-- =====================================================
-- FIX: Sync Group Leaders to Members (Safe Version)
-- Garante que todos os líderes e co-líderes estejam na tabela group_members
-- Usa ON CONFLICT para evitar erros de duplicação
-- =====================================================

DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Loop através de todos os grupos ativos
    FOR r IN SELECT * FROM groups WHERE deleted_at IS NULL LOOP
        
        -- 1. Inserir Líder se não existir
        IF r.leader_id IS NOT NULL THEN
            INSERT INTO group_members (group_id, member_id, role)
            VALUES (r.id, r.leader_id, 'Líder')
            ON CONFLICT (group_id, member_id) WHERE left_at IS NULL
            DO UPDATE SET role = 'Líder'; -- Atualiza o papel se já existir mas não for Líder
        END IF;

        -- 2. Inserir Co-líder se não existir
        IF r.co_leader_id IS NOT NULL THEN
            INSERT INTO group_members (group_id, member_id, role)
            VALUES (r.id, r.co_leader_id, 'Co-líder')
            ON CONFLICT (group_id, member_id) WHERE left_at IS NULL
            DO UPDATE SET role = 'Co-líder';
        END IF;

    END LOOP;
END $$;
