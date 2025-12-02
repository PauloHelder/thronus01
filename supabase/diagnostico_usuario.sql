-- =====================================================
-- DIAGNÓSTICO: Verificar usuário mvidaegraca21@gmail.com
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- 1. Verificar se o usuário existe no Auth
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    last_sign_in_at,
    confirmation_sent_at
FROM auth.users 
WHERE email = 'mvidaegraca21@gmail.com';

-- 2. Verificar se existe igreja com este email
SELECT 
    id,
    name,
    email,
    plan_id,
    subscription_status,
    created_at
FROM churches 
WHERE email = 'mvidaegraca21@gmail.com';

-- 3. Verificar se existe membro com este email
SELECT 
    id,
    church_id,
    name,
    email,
    status,
    created_at
FROM members 
WHERE email = 'mvidaegraca21@gmail.com';

-- 4. Verificar se existe registro na tabela users
SELECT 
    u.id,
    u.email,
    u.church_id,
    u.member_id,
    u.role,
    c.name as church_name
FROM users u
LEFT JOIN churches c ON u.church_id = c.id
WHERE u.email = 'mvidaegraca21@gmail.com';

-- 5. Verificar todos os dados relacionados
SELECT 
    'Auth User' as tipo,
    COUNT(*) as quantidade
FROM auth.users 
WHERE email = 'mvidaegraca21@gmail.com'

UNION ALL

SELECT 'Church', COUNT(*) 
FROM churches 
WHERE email = 'mvidaegraca21@gmail.com'

UNION ALL

SELECT 'Member', COUNT(*) 
FROM members 
WHERE email = 'mvidaegraca21@gmail.com'

UNION ALL

SELECT 'User Record', COUNT(*) 
FROM users 
WHERE email = 'mvidaegraca21@gmail.com';
