-- ATUALIZAÇÃO MANUAL DE MEMBROS
-- Execute este script no Editor SQL do Supabase

-- 1. Adicionar colunas faltantes na tabela members
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS occupation text, -- Profissão
ADD COLUMN IF NOT EXISTS notes text, -- Observações
ADD COLUMN IF NOT EXISTS join_date date DEFAULT CURRENT_DATE; -- Data de Entrada

-- 2. Garantir que a tabela Groups existe e tem coluna name (para referência)
-- (Geralmente já existe, isso é apenas preventivo)
-- CREATE TABLE IF NOT EXISTS public.groups (...);

-- 3. Atualizar cache do esquema (apenas para garantir que o PostgREST veja as mudanças)
NOTIFY pgrst, 'reload config';
