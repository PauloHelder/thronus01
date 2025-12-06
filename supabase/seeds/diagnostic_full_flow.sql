-- Script de diagnóstico completo do fluxo de cadastro

-- 1. Verificar se a função complete_signup existe
SELECT 
    proname as function_name,
    pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'complete_signup';

-- 2. Verificar quantas igrejas existem
SELECT COUNT(*) as total_churches FROM churches;

-- 3. Listar todas as igrejas
SELECT 
    id,
    name,
    slug,
    email,
    created_at
FROM churches
ORDER BY created_at DESC
LIMIT 10;

-- 4. Verificar quantos usuários existem
SELECT COUNT(*) as total_users FROM public.users;

-- 5. Listar todos os usuários e suas igrejas
SELECT 
    u.id,
    u.email,
    u.role,
    u.church_id,
    c.name as church_name,
    m.name as member_name
FROM public.users u
LEFT JOIN churches c ON u.church_id = c.id
LEFT JOIN members m ON u.member_id = m.id
ORDER BY u.created_at DESC
LIMIT 10;

-- 6. Verificar quantos membros existem
SELECT COUNT(*) as total_members FROM members;

-- 7. Listar todos os membros
SELECT 
    m.id,
    m.name,
    m.email,
    m.church_id,
    c.name as church_name,
    m.created_at
FROM members m
LEFT JOIN churches c ON m.church_id = c.id
ORDER BY m.created_at DESC
LIMIT 10;

SELECT 'Diagnóstico completo concluído.' as status;
