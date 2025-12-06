-- Script para corrigir permissões de inserção na tabela members
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se o usuário atual existe na tabela public.users
SELECT * FROM public.users WHERE id = auth.uid();

-- 2. Garantir que a política de INSERT permita o usuário inserir
DROP POLICY IF EXISTS "Users can insert own church members" ON members;

CREATE POLICY "Users can insert own church members" ON members
    FOR INSERT WITH CHECK (
        -- O church_id do novo registro deve ser igual ao church_id do usuário logado
        church_id = (SELECT church_id FROM public.users WHERE id = auth.uid())
    );

-- 3. Garantir que a política de SELECT também esteja correta para ver o membro inserido
DROP POLICY IF EXISTS "Users can view own church members" ON members;

CREATE POLICY "Users can view own church members" ON members
    FOR SELECT USING (
        church_id = (SELECT church_id FROM public.users WHERE id = auth.uid())
    );

-- 4. Garantir permissão de UPDATE
DROP POLICY IF EXISTS "Users can update own church members" ON members;

CREATE POLICY "Users can update own church members" ON members
    FOR UPDATE USING (
        church_id = (SELECT church_id FROM public.users WHERE id = auth.uid())
    );

-- 5. Verificar colunas obrigatórias
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'members' AND is_nullable = 'NO';

-- Mensagem final de sucesso
SELECT 'Políticas de RLS para members atualizadas com sucesso.' as status;
