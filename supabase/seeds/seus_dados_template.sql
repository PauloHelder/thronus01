conn-- =====================================================
-- THRONUS V5 - SEUS DADOS DE TESTE
-- Template para adicionar sua igreja e dados iniciais
-- =====================================================

-- =====================================================
-- 1. CRIAR SUA IGREJA
-- =====================================================

-- Substitua os valores abaixo com os dados da sua igreja
INSERT INTO churches (
    id,
    name,
    slug,
    email,
    phone,
    website,
    address,
    neighborhood,
    district,
    municipality,
    province,
    country,
    plan_id,
    subscription_status
) VALUES (
    gen_random_uuid(), -- ID será gerado automaticamente
    'Nome da Sua Igreja', -- ALTERE AQUI
    'sua-igreja-slug', -- ALTERE AQUI (sem espaços, minúsculas)
    'contato@suaigreja.com', -- ALTERE AQUI
    '+244 923 456 789', -- ALTERE AQUI
    'https://suaigreja.com', -- ALTERE AQUI (ou NULL)
    'Rua Principal, 123', -- ALTERE AQUI
    'Bairro', -- ALTERE AQUI
    'Distrito', -- ALTERE AQUI
    'Município', -- ALTERE AQUI
    'Província', -- ALTERE AQUI
    'Angola', -- ALTERE AQUI
    '00000000-0000-0000-0000-000000000002', -- Plano Profissional (ou use 001 para Free, 003 para Premium)
    'active' -- Status: 'trial', 'active', 'expired', 'cancelled'
)
RETURNING id, name, slug;

-- IMPORTANTE: Copie o ID retornado acima e use nas próximas queries
-- Substitua 'SEU-CHURCH-ID' pelo ID retornado

-- =====================================================
-- 2. CRIAR DEPARTAMENTOS PADRÃO
-- =====================================================

-- Secretaria
INSERT INTO departments (church_id, name, icon, description, is_default)
VALUES (
    'SEU-CHURCH-ID', -- COLE O ID DA SUA IGREJA AQUI
    'Secretaria',
    'FileText',
    'Departamento responsável pela administração e documentação',
    true
);

-- Finanças
INSERT INTO departments (church_id, name, icon, description, is_default)
VALUES (
    'SEU-CHURCH-ID', -- COLE O ID DA SUA IGREJA AQUI
    'Finanças',
    'DollarSign',
    'Departamento responsável pela gestão financeira',
    true
);

-- Louvor
INSERT INTO departments (church_id, name, icon, description, is_default)
VALUES (
    'SEU-CHURCH-ID', -- COLE O ID DA SUA IGREJA AQUI
    'Louvor',
    'Music',
    'Departamento de música e louvor',
    true
);

-- =====================================================
-- 3. CRIAR CATEGORIAS FINANCEIRAS PADRÃO
-- =====================================================

-- Categorias de Receita
INSERT INTO transaction_categories (church_id, name, type, is_system) VALUES
('SEU-CHURCH-ID', 'Dízimos', 'Income', true),
('SEU-CHURCH-ID', 'Ofertas', 'Income', true),
('SEU-CHURCH-ID', 'Doações', 'Income', true);

-- Categorias de Despesa
INSERT INTO transaction_categories (church_id, name, type, is_system) VALUES
('SEU-CHURCH-ID', 'Aluguel', 'Expense', true),
('SEU-CHURCH-ID', 'Água e Luz', 'Expense', true),
('SEU-CHURCH-ID', 'Salários', 'Expense', true),
('SEU-CHURCH-ID', 'Manutenção', 'Expense', false),
('SEU-CHURCH-ID', 'Material de Escritório', 'Expense', false);

-- =====================================================
-- 4. CRIAR ESTÁGIOS CRISTÃOS
-- =====================================================

INSERT INTO christian_stages (church_id, name, description, order_index) VALUES
('SEU-CHURCH-ID', 'Novo Convertido', 'Pessoa que acabou de aceitar Jesus', 1),
('SEU-CHURCH-ID', 'Discípulo', 'Pessoa em processo de discipulado', 2),
('SEU-CHURCH-ID', 'Obreiro', 'Pessoa preparada para servir', 3),
('SEU-CHURCH-ID', 'Líder', 'Pessoa capacitada para liderar', 4);

-- =====================================================
-- 5. CRIAR CATEGORIAS DE ENSINO
-- =====================================================

INSERT INTO teaching_categories (church_id, name, description) VALUES
('SEU-CHURCH-ID', 'Homogenia', 'Ensino por faixa etária'),
('SEU-CHURCH-ID', 'Adultos', 'Ensino para adultos'),
('SEU-CHURCH-ID', 'Jovens', 'Ensino para jovens'),
('SEU-CHURCH-ID', 'Adolescentes', 'Ensino para adolescentes'),
('SEU-CHURCH-ID', 'Crianças', 'Ensino para crianças');

-- =====================================================
-- 6. EXEMPLO: ADICIONAR MEMBROS
-- =====================================================

-- Pastor/Líder Principal
INSERT INTO members (
    church_id,
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
    'SEU-CHURCH-ID',
    'Pastor João Silva', -- ALTERE AQUI
    'pastor@suaigreja.com', -- ALTERE AQUI
    '+244 923 111 001', -- ALTERE AQUI
    'Male',
    '1975-05-15', -- ALTERE AQUI
    'Married',
    'Active',
    'Pastor',
    true,
    '1995-08-20' -- ALTERE AQUI
)
RETURNING id, name, member_code;

-- Adicione mais membros copiando e modificando o bloco acima
-- O member_code será gerado automaticamente (M001, M002, etc.)

-- =====================================================
-- 7. EXEMPLO: ADICIONAR GRUPO
-- =====================================================

-- Primeiro, obtenha o ID de um membro para ser líder
-- Depois execute:

INSERT INTO groups (
    church_id,
    name,
    description,
    leader_id, -- ID do membro líder
    meeting_day,
    meeting_time,
    meeting_place,
    status
) VALUES (
    'SEU-CHURCH-ID',
    'Célula Central', -- ALTERE AQUI
    'Célula de jovens e adultos', -- ALTERE AQUI
    'ID-DO-MEMBRO-LIDER', -- COLE O ID DO LÍDER AQUI
    'Quarta', -- Dia da semana
    '19:00:00', -- Horário
    'Casa do Líder', -- ALTERE AQUI
    'Active'
)
RETURNING id, name;

-- =====================================================
-- 8. VERIFICAÇÃO
-- =====================================================

-- Execute para verificar seus dados
SELECT 
    'Churches' as entity, 
    COUNT(*) as count,
    STRING_AGG(name, ', ') as names
FROM churches
GROUP BY 'Churches'

UNION ALL

SELECT 
    'Members',
    COUNT(*),
    STRING_AGG(name, ', ')
FROM members
WHERE church_id = 'SEU-CHURCH-ID'
GROUP BY 'Members'

UNION ALL

SELECT 
    'Departments',
    COUNT(*),
    STRING_AGG(name, ', ')
FROM departments
WHERE church_id = 'SEU-CHURCH-ID'
GROUP BY 'Departments'

UNION ALL

SELECT 
    'Groups',
    COUNT(*),
    STRING_AGG(name, ', ')
FROM groups
WHERE church_id = 'SEU-CHURCH-ID'
GROUP BY 'Groups';

-- =====================================================
-- DICAS
-- =====================================================

-- 1. Sempre substitua 'SEU-CHURCH-ID' pelo ID real da sua igreja
-- 2. O member_code é gerado automaticamente (M001, M002, etc.)
-- 3. Use gen_random_uuid() para gerar IDs automaticamente
-- 4. Campos opcionais podem ser NULL
-- 5. Datas devem estar no formato 'YYYY-MM-DD'
-- 6. Horários no formato 'HH:MM:SS'

-- =====================================================
-- PRÓXIMOS PASSOS
-- =====================================================

-- Após adicionar seus dados:
-- 1. Crie um usuário no Supabase Auth
-- 2. Vincule o usuário à sua igreja na tabela 'users'
-- 3. Comece a usar o sistema!
