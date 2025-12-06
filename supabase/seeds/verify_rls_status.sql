-- Script para VERIFICAR o estado atual das políticas RLS

-- 1. Verificar se RLS está habilitado nas tabelas
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('members', 'users')
ORDER BY tablename;

-- 2. Listar todas as políticas da tabela members
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'members'
ORDER BY policyname;

-- 3. Listar todas as políticas da tabela users
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- 4. Verificar seu usuário atual e church_id
SELECT 
    id,
    email,
    church_id,
    role
FROM public.users
WHERE id = auth.uid();

SELECT 'Verificação completa. Revise as políticas acima.' as status;
