-- =====================================================
-- DEBUG: Verificar configuração do usuário
-- Execute este script para verificar se tudo está configurado
-- =====================================================

-- 1. Verificar se o usuário atual tem church_id
SELECT 
    u.id as user_id,
    u.email,
    u.church_id,
    c.name as church_name
FROM users u
LEFT JOIN churches c ON u.church_id = c.id
WHERE u.id = auth.uid();

-- 2. Verificar políticas RLS da tabela services
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'services';

-- 3. Verificar políticas RLS da tabela service_types
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'service_types';

-- 4. Verificar se RLS está habilitado
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('services', 'service_types');
