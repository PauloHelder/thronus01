-- =====================================================
-- FIX: Update groups status check constraint
-- Permite valores em português: 'Ativo', 'Inativo', 'Cheio'
-- =====================================================

DO $$ 
BEGIN
    -- 1. Remove a constraint antiga se existir
    ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_status_check;

    -- 2. Adiciona a nova constraint com os valores corretos
    ALTER TABLE groups 
    ADD CONSTRAINT groups_status_check 
    CHECK (status IN ('Ativo', 'Inativo', 'Cheio', 'Active', 'Inactive', 'Full')); 
    -- Mantivemos inglês também por compatibilidade com dados antigos se houver

    -- 3. Atualiza dados existentes se necessário (opcional, para evitar inconsistência)
    -- UPDATE groups SET status = 'Ativo' WHERE status = 'Active';
    -- UPDATE groups SET status = 'Inativo' WHERE status = 'Inactive';
    -- UPDATE groups SET status = 'Cheio' WHERE status = 'Full';

END $$;
