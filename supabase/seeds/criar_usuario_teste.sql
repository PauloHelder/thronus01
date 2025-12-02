-- =====================================================
-- CRIAR USUÁRIO DE TESTE - Thronus V5
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- IMPORTANTE: Primeiro você precisa criar o usuário no Supabase Auth
-- Vá para: Authentication > Users > Add User
-- Email: teste@thronus.com
-- Password: teste123
-- Copie o ID do usuário criado e substitua 'USER-ID-AQUI' abaixo

-- =====================================================
-- 1. CRIAR IGREJA DE TESTE
-- =====================================================

INSERT INTO churches (
    id,
    name,
    slug,
    email,
    phone,
    address,
    neighborhood,
    district,
    municipality,
    province,
    country,
    plan_id,
    subscription_status,
    settings
) VALUES (
    '10000000-0000-0000-0000-000000000099',
    'Igreja de Teste',
    'igreja-teste',
    'teste@thronus.com',
    '+244 923 000 000',
    'Rua de Teste, 123',
    'Bairro Teste',
    'Distrito Teste',
    'Viana',
    'Luanda',
    'Angola',
    '00000000-0000-0000-0000-000000000002', -- Plano Profissional
    'active',
    '{
        "sigla": "IT",
        "denominacao": "Igreja Teste",
        "nif": "999999999",
        "categoria": "Sede"
    }'
);

-- =====================================================
-- 2. CRIAR MEMBRO (PASTOR DE TESTE)
-- =====================================================

INSERT INTO members (
    id,
    church_id,
    member_code,
    name,
    email,
    phone,
    gender,
    birth_date,
    marital_status,
    status,
    church_role,
    is_baptized,
    baptism_date
) VALUES (
    '20000000-0000-0000-0000-000000000099',
    '10000000-0000-0000-0000-000000000099',
    'M001',
    'Pastor Teste',
    'teste@thronus.com',
    '+244 923 000 000',
    'Male',
    '1980-01-01',
    'Married',
    'Active',
    'Pastor',
    true,
    '2000-01-01'
);

-- =====================================================
-- 3. VINCULAR USUÁRIO À IGREJA
-- =====================================================

-- SUBSTITUA 'USER-ID-AQUI' pelo ID do usuário criado no Supabase Auth
INSERT INTO users (
    id,
    church_id,
    member_id,
    email,
    role,
    permissions
) VALUES (
    'USER-ID-AQUI', -- COLE O ID DO USUÁRIO DO SUPABASE AUTH AQUI
    '10000000-0000-0000-0000-000000000099',
    '20000000-0000-0000-0000-000000000099',
    'teste@thronus.com',
    'admin',
    '{}'
);

-- =====================================================
-- 4. CRIAR DEPARTAMENTOS PADRÃO
-- =====================================================

INSERT INTO departments (church_id, name, icon, description, is_default) VALUES
('10000000-0000-0000-0000-000000000099', 'Secretaria', 'FileText', 'Departamento de administração', true),
('10000000-0000-0000-0000-000000000099', 'Finanças', 'DollarSign', 'Departamento financeiro', true),
('10000000-0000-0000-0000-000000000099', 'Louvor', 'Music', 'Departamento de música', true);

-- =====================================================
-- 5. CRIAR CATEGORIAS FINANCEIRAS
-- =====================================================

INSERT INTO transaction_categories (church_id, name, type, is_system) VALUES
('10000000-0000-0000-0000-000000000099', 'Dízimos', 'Income', true),
('10000000-0000-0000-0000-000000000099', 'Ofertas', 'Income', true),
('10000000-0000-0000-0000-000000000099', 'Doações', 'Income', true),
('10000000-0000-0000-0000-000000000099', 'Aluguel', 'Expense', true),
('10000000-0000-0000-0000-000000000099', 'Água e Luz', 'Expense', true),
('10000000-0000-0000-0000-000000000099', 'Salários', 'Expense', true);

-- =====================================================
-- 6. CRIAR ESTÁGIOS CRISTÃOS
-- =====================================================

INSERT INTO christian_stages (church_id, name, description, order_index) VALUES
('10000000-0000-0000-0000-000000000099', 'Novo Convertido', 'Pessoa que acabou de aceitar Jesus', 1),
('10000000-0000-0000-0000-000000000099', 'Discípulo', 'Pessoa em processo de discipulado', 2),
('10000000-0000-0000-0000-000000000099', 'Obreiro', 'Pessoa preparada para servir', 3),
('10000000-0000-0000-0000-000000000099', 'Líder', 'Pessoa capacitada para liderar', 4);

-- =====================================================
-- 7. CRIAR CATEGORIAS DE ENSINO
-- =====================================================

INSERT INTO teaching_categories (church_id, name, description) VALUES
('10000000-0000-0000-0000-000000000099', 'Homogenia', 'Ensino por faixa etária'),
('10000000-0000-0000-0000-000000000099', 'Adultos', 'Ensino para adultos'),
('10000000-0000-0000-0000-000000000099', 'Jovens', 'Ensino para jovens'),
('10000000-0000-0000-0000-000000000099', 'Adolescentes', 'Ensino para adolescentes'),
('10000000-0000-0000-0000-000000000099', 'Crianças', 'Ensino para crianças');

-- =====================================================
-- 8. CRIAR ALGUNS MEMBROS DE TESTE
-- =====================================================

INSERT INTO members (church_id, name, email, phone, gender, birth_date, marital_status, status, church_role, is_baptized) VALUES
('10000000-0000-0000-0000-000000000099', 'João Silva', 'joao@teste.com', '+244 923 111 001', 'Male', '1990-05-15', 'Married', 'Active', 'Membro', true),
('10000000-0000-0000-0000-000000000099', 'Maria Santos', 'maria@teste.com', '+244 923 111 002', 'Female', '1985-08-20', 'Married', 'Active', 'Líder', true),
('10000000-0000-0000-0000-000000000099', 'Pedro Costa', 'pedro@teste.com', '+244 923 111 003', 'Male', '1995-03-10', 'Single', 'Active', 'Membro', true),
('10000000-0000-0000-0000-000000000099', 'Ana Oliveira', 'ana@teste.com', '+244 923 111 004', 'Female', '1992-11-25', 'Single', 'Active', 'Membro', true),
('10000000-0000-0000-0000-000000000099', 'Carlos Ferreira', 'carlos@teste.com', '+244 923 111 005', 'Male', '1988-07-30', 'Married', 'Active', 'Diácono', true);

-- =====================================================
-- 9. CRIAR GRUPOS DE TESTE
-- =====================================================

-- Obter IDs dos membros para usar como líderes
DO $$
DECLARE
    maria_id UUID;
    joao_id UUID;
    grupo1_id UUID;
    grupo2_id UUID;
BEGIN
    -- Buscar IDs dos membros
    SELECT id INTO maria_id FROM members WHERE email = 'maria@teste.com';
    SELECT id INTO joao_id FROM members WHERE email = 'joao@teste.com';
    
    -- Criar Grupo 1
    INSERT INTO groups (church_id, name, description, leader_id, meeting_day, meeting_time, meeting_place, status)
    VALUES ('10000000-0000-0000-0000-000000000099', 'Célula Central', 'Grupo de jovens e adultos', maria_id, 'Quarta', '19:00:00', 'Casa da Líder', 'Active')
    RETURNING id INTO grupo1_id;
    
    -- Criar Grupo 2
    INSERT INTO groups (church_id, name, description, leader_id, meeting_day, meeting_time, meeting_place, status)
    VALUES ('10000000-0000-0000-0000-000000000099', 'Grupo de Homens', 'Grupo masculino', joao_id, 'Sábado', '08:00:00', 'Igreja', 'Active')
    RETURNING id INTO grupo2_id;
    
    -- Adicionar membros aos grupos
    INSERT INTO group_members (group_id, member_id, role) VALUES
    (grupo1_id, maria_id, 'Líder'),
    (grupo2_id, joao_id, 'Líder');
END $$;

-- =====================================================
-- 10. CRIAR EVENTOS DE TESTE
-- =====================================================

INSERT INTO events (church_id, title, description, type, date, start_time, end_time, location, status) VALUES
('10000000-0000-0000-0000-000000000099', 'Culto de Domingo', 'Culto dominical', 'Culto', CURRENT_DATE + INTERVAL '3 days', '10:00:00', '12:00:00', 'Igreja Principal', 'Scheduled'),
('10000000-0000-0000-0000-000000000099', 'Encontro de Jovens', 'Reunião de jovens', 'Reunião', CURRENT_DATE + INTERVAL '5 days', '19:00:00', '21:00:00', 'Salão da Igreja', 'Scheduled'),
('10000000-0000-0000-0000-000000000099', 'Ação Social', 'Distribuição de alimentos', 'Ação Social', CURRENT_DATE + INTERVAL '7 days', '09:00:00', '13:00:00', 'Comunidade', 'Scheduled');

-- =====================================================
-- 11. CRIAR TRANSAÇÕES FINANCEIRAS DE TESTE
-- =====================================================

DO $$
DECLARE
    dizimos_id UUID;
    ofertas_id UUID;
    aluguel_id UUID;
BEGIN
    -- Buscar IDs das categorias
    SELECT id INTO dizimos_id FROM transaction_categories WHERE name = 'Dízimos' AND church_id = '10000000-0000-0000-0000-000000000099';
    SELECT id INTO ofertas_id FROM transaction_categories WHERE name = 'Ofertas' AND church_id = '10000000-0000-0000-0000-000000000099';
    SELECT id INTO aluguel_id FROM transaction_categories WHERE name = 'Aluguel' AND church_id = '10000000-0000-0000-0000-000000000099';
    
    -- Criar transações
    INSERT INTO transactions (church_id, type, category_id, amount, date, description, source) VALUES
    ('10000000-0000-0000-0000-000000000099', 'Income', dizimos_id, 50000.00, CURRENT_DATE - INTERVAL '5 days', 'Dízimos do culto', 'Culto'),
    ('10000000-0000-0000-0000-000000000099', 'Income', ofertas_id, 25000.00, CURRENT_DATE - INTERVAL '3 days', 'Ofertas do culto', 'Culto'),
    ('10000000-0000-0000-0000-000000000099', 'Income', dizimos_id, 45000.00, CURRENT_DATE - INTERVAL '1 days', 'Dízimos do culto', 'Culto'),
    ('10000000-0000-0000-0000-000000000099', 'Expense', aluguel_id, 30000.00, CURRENT_DATE - INTERVAL '2 days', 'Aluguel do salão', 'Despesa Fixa');
END $$;

-- =====================================================
-- 12. VERIFICAÇÃO
-- =====================================================

SELECT 
    'Churches' as entity, 
    COUNT(*) as count 
FROM churches 
WHERE id = '10000000-0000-0000-0000-000000000099'

UNION ALL

SELECT 'Members', COUNT(*) 
FROM members 
WHERE church_id = '10000000-0000-0000-0000-000000000099'

UNION ALL

SELECT 'Groups', COUNT(*) 
FROM groups 
WHERE church_id = '10000000-0000-0000-0000-000000000099'

UNION ALL

SELECT 'Departments', COUNT(*) 
FROM departments 
WHERE church_id = '10000000-0000-0000-0000-000000000099'

UNION ALL

SELECT 'Events', COUNT(*) 
FROM events 
WHERE church_id = '10000000-0000-0000-0000-000000000099'

UNION ALL

SELECT 'Transactions', COUNT(*) 
FROM transactions 
WHERE church_id = '10000000-0000-0000-0000-000000000099';

-- Resultado esperado:
-- Churches: 1
-- Members: 6 (Pastor + 5 membros)
-- Groups: 2
-- Departments: 3
-- Events: 3
-- Transactions: 4
