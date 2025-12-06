-- =====================================================
-- FIX: Add location column to groups table
-- Execute este script para corrigir o erro PGRST204
-- =====================================================

DO $$ 
BEGIN
    -- Adiciona a coluna location se não existir
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'groups' 
        AND column_name = 'location'
    ) THEN
        ALTER TABLE groups 
        ADD COLUMN location TEXT;
    END IF;

    -- Adiciona outras colunas que podem estar faltando, por garantia
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'groups' 
        AND column_name = 'address'
    ) THEN
        ALTER TABLE groups 
        ADD COLUMN address TEXT;
    END IF;

    -- Recarrega o cache do schema (opcional, mas bom para garantir)
    NOTIFY pgrst, 'reload schema';
END $$;
