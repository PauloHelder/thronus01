-- Script FINAL para corrigir problemas de RLS (Permissões)
-- Este script resolve o problema de "dependência circular" nas permissões

-- 1. Permitir que qualquer usuário autenticado leia a tabela de usuários
-- Isso é necessário para que as políticas da tabela 'members' consigam verificar o 'church_id'
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

CREATE POLICY "Allow read access for authenticated users" ON public.users
FOR SELECT TO authenticated USING (true);

-- 2. Recriar políticas da tabela members simplificadas
DROP POLICY IF EXISTS "Users can insert own church members" ON members;
DROP POLICY IF EXISTS "Users can view own church members" ON members;
DROP POLICY IF EXISTS "Users can update own church members" ON members;
DROP POLICY IF EXISTS "Users can delete own church members" ON members;

-- Política de LEITURA
CREATE POLICY "Users can view own church members" ON members
FOR SELECT USING (
    church_id IN (SELECT church_id FROM public.users WHERE id = auth.uid())
);

-- Política de INSERÇÃO
CREATE POLICY "Users can insert own church members" ON members
FOR INSERT WITH CHECK (
    church_id IN (SELECT church_id FROM public.users WHERE id = auth.uid())
);

-- Política de ATUALIZAÇÃO
CREATE POLICY "Users can update own church members" ON members
FOR UPDATE USING (
    church_id IN (SELECT church_id FROM public.users WHERE id = auth.uid())
);

-- Política de EXCLUSÃO
CREATE POLICY "Users can delete own church members" ON members
FOR DELETE USING (
    church_id IN (SELECT church_id FROM public.users WHERE id = auth.uid())
);

SELECT 'Permissões corrigidas definitivamente.' as status;
