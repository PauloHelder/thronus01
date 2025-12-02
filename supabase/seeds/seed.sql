-- =====================================================
-- THRONUS V5 - SEED DATA
-- Mock data for testing and development
-- =====================================================

-- =====================================================
-- PLANS
-- =====================================================

INSERT INTO plans (id, name, price, billing_period, features, is_active) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'Free',
    0.00,
    'monthly',
    '{
        "canLinkToSupervision": false,
        "canBeLinked": 0,
        "customBranding": false,
        "maxMembers": 50,
        "maxGroups": 5,
        "serviceStatistics": false,
        "exportStatistics": false,
        "exportFinances": false,
        "maxLeaders": 5,
        "maxDisciples": 10,
        "maxDepartments": 3,
        "maxClasses": 3,
        "maxEvents": 10
    }',
    true
),
(
    '00000000-0000-0000-0000-000000000002',
    'Profissional',
    49.99,
    'monthly',
    '{
        "canLinkToSupervision": true,
        "canBeLinked": 5,
        "customBranding": true,
        "maxMembers": 500,
        "maxGroups": 50,
        "serviceStatistics": true,
        "exportStatistics": true,
        "exportFinances": true,
        "maxLeaders": 50,
        "maxDisciples": 100,
        "maxDepartments": 20,
        "maxClasses": 20,
        "maxEvents": 100
    }',
    true
),
(
    '00000000-0000-0000-0000-000000000003',
    'Premium',
    99.99,
    'monthly',
    '{
        "canLinkToSupervision": true,
        "canBeLinked": "unlimited",
        "customBranding": true,
        "maxMembers": "unlimited",
        "maxGroups": "unlimited",
        "serviceStatistics": true,
        "exportStatistics": true,
        "exportFinances": true,
        "maxLeaders": "unlimited",
        "maxDisciples": "unlimited",
        "maxDepartments": "unlimited",
        "maxClasses": "unlimited",
        "maxEvents": "unlimited"
    }',
    true
);

-- =====================================================
-- CHURCHES
-- =====================================================

INSERT INTO churches (id, name, slug, email, phone, website, address, neighborhood, district, municipality, province, country, plan_id, subscription_status, trial_ends_at) VALUES
(
    '10000000-0000-0000-0000-000000000001',
    'Igreja Evangélica Assembleia de Deus',
    'iead-luanda',
    'contato@iead-luanda.ao',
    '+244 923 456 789',
    'https://iead-luanda.ao',
    'Rua Comandante Gika, 123',
    'Maculusso',
    'Ingombota',
    'Luanda',
    'Luanda',
    'Angola',
    '00000000-0000-0000-0000-000000000002',
    'active',
    NULL
),
(
    '10000000-0000-0000-0000-000000000002',
    'Igreja Batista Central',
    'ibc-benguela',
    'contato@ibc-benguela.ao',
    '+244 923 456 790',
    'https://ibc-benguela.ao',
    'Avenida Norton de Matos, 456',
    'Centro',
    'Benguela',
    'Benguela',
    'Benguela',
    'Angola',
    '00000000-0000-0000-0000-000000000001',
    'trial',
    NOW() + INTERVAL '30 days'
);

-- =====================================================
-- SUBSCRIPTIONS
-- =====================================================

INSERT INTO subscriptions (church_id, plan_id, duration_months, start_date, end_date, status, total_amount, payment_method) VALUES
(
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    12,
    '2024-01-01',
    '2024-12-31',
    'active',
    599.88,
    'Bank Transfer'
);

-- =====================================================
-- MEMBERS - Church 1 (IEAD Luanda)
-- =====================================================

INSERT INTO members (id, church_id, member_code, name, email, phone, avatar_url, gender, birth_date, marital_status, address, neighborhood, district, municipality, province, country, status, church_role, is_baptized, baptism_date) VALUES
-- Leaders and Staff
(
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'M001',
    'Pastor João Silva',
    'joao.silva@iead-luanda.ao',
    '+244 923 111 001',
    'https://i.pravatar.cc/150?u=joao',
    'Male',
    '1975-05-15',
    'Married',
    'Rua das Acácias, 45',
    'Maculusso',
    'Ingombota',
    'Luanda',
    'Luanda',
    'Angola',
    'Active',
    'Pastor',
    true,
    '1995-08-20'
),
(
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'M002',
    'Maria Santos',
    'maria.santos@iead-luanda.ao',
    '+244 923 111 002',
    'https://i.pravatar.cc/150?u=maria',
    'Female',
    '1987-02-14',
    'Married',
    'Rua Comandante Gika, 123',
    'Maculusso',
    'Ingombota',
    'Luanda',
    'Luanda',
    'Angola',
    'Active',
    'Líder',
    true,
    '2016-06-15'
),
(
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    'M003',
    'Carlos Mendes',
    'carlos.mendes@iead-luanda.ao',
    '+244 923 111 003',
    'https://i.pravatar.cc/150?u=carlos',
    'Male',
    '1990-11-22',
    'Single',
    'Avenida 4 de Fevereiro, 789',
    'Maianga',
    'Maianga',
    'Luanda',
    'Luanda',
    'Angola',
    'Active',
    'Diácono',
    true,
    '2018-12-25'
),
-- Active Members
(
    '20000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000001',
    'M004',
    'Ana Costa',
    'ana.costa@example.com',
    '+244 923 111 004',
    'https://i.pravatar.cc/150?u=ana',
    'Female',
    '1995-03-10',
    'Single',
    'Rua Rainha Ginga, 234',
    'Maianga',
    'Maianga',
    'Luanda',
    'Luanda',
    'Angola',
    'Active',
    'Membro',
    true,
    '2020-05-15'
),
(
    '20000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000001',
    'M005',
    'Pedro Oliveira',
    'pedro.oliveira@example.com',
    '+244 923 111 005',
    'https://i.pravatar.cc/150?u=pedro',
    'Male',
    '1992-09-05',
    'Married',
    'Rua Direita, 567',
    'Ingombota',
    'Ingombota',
    'Luanda',
    'Luanda',
    'Angola',
    'Active',
    'Membro',
    true,
    '2019-08-10'
),
(
    '20000000-0000-0000-0000-000000000006',
    '10000000-0000-0000-0000-000000000001',
    'M006',
    'Julia Lima',
    'julia.lima@example.com',
    '+244 923 111 006',
    'https://i.pravatar.cc/150?u=julia',
    'Female',
    '1988-07-18',
    'Married',
    'Rua da Missão, 890',
    'Maculusso',
    'Ingombota',
    'Luanda',
    'Luanda',
    'Angola',
    'Active',
    'Membro',
    true,
    '2017-03-20'
),
(
    '20000000-0000-0000-0000-000000000007',
    '10000000-0000-0000-0000-000000000001',
    'M007',
    'Lucas Fernandes',
    'lucas.fernandes@example.com',
    '+244 923 111 007',
    'https://i.pravatar.cc/150?u=lucas',
    'Male',
    '1998-12-30',
    'Single',
    'Avenida Lenine, 123',
    'Maianga',
    'Maianga',
    'Luanda',
    'Luanda',
    'Angola',
    'Active',
    'Membro',
    true,
    '2021-11-05'
),
(
    '20000000-0000-0000-0000-000000000008',
    '10000000-0000-0000-0000-000000000001',
    'M008',
    'Sofia Rodrigues',
    'sofia.rodrigues@example.com',
    '+244 923 111 008',
    'https://i.pravatar.cc/150?u=sofia',
    'Female',
    '1993-04-25',
    'Single',
    'Rua Amilcar Cabral, 456',
    'Ingombota',
    'Ingombota',
    'Luanda',
    'Luanda',
    'Angola',
    'Active',
    'Membro',
    true,
    '2020-09-12'
),
-- Visitors
(
    '20000000-0000-0000-0000-000000000009',
    '10000000-0000-0000-0000-000000000001',
    'M009',
    'Rafael Sousa',
    'rafael.sousa@example.com',
    '+244 923 111 009',
    'https://i.pravatar.cc/150?u=rafael',
    'Male',
    '1996-06-14',
    'Single',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'Angola',
    'Visitor',
    'Visitante',
    false,
    NULL
),
(
    '20000000-0000-0000-0000-000000000010',
    '10000000-0000-0000-0000-000000000001',
    'M010',
    'Beatriz Alves',
    'beatriz.alves@example.com',
    '+244 923 111 010',
    'https://i.pravatar.cc/150?u=beatriz',
    'Female',
    '2000-01-08',
    'Single',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'Angola',
    'Visitor',
    'Visitante',
    false,
    NULL
);

-- =====================================================
-- MEMBERS - Church 2 (IBC Benguela)
-- =====================================================

INSERT INTO members (id, church_id, member_code, name, email, phone, avatar_url, gender, birth_date, marital_status, status, church_role, is_baptized, baptism_date) VALUES
(
    '20000000-0000-0000-0000-000000000101',
    '10000000-0000-0000-0000-000000000002',
    'M001',
    'Pastor António Neto',
    'antonio.neto@ibc-benguela.ao',
    '+244 923 222 001',
    'https://i.pravatar.cc/150?u=antonio',
    'Male',
    '1970-03-20',
    'Married',
    'Active',
    'Pastor',
    true,
    '1990-05-10'
),
(
    '20000000-0000-0000-0000-000000000102',
    '10000000-0000-0000-0000-000000000002',
    'M002',
    'Isabel Cardoso',
    'isabel.cardoso@ibc-benguela.ao',
    '+244 923 222 002',
    'https://i.pravatar.cc/150?u=isabel',
    'Female',
    '1985-08-15',
    'Married',
    'Active',
    'Líder',
    true,
    '2010-07-20'
);

-- =====================================================
-- GROUPS (CÉLULAS)
-- =====================================================

INSERT INTO groups (id, church_id, name, description, leader_id, co_leader_id, meeting_day, meeting_time, meeting_place, address, neighborhood, district, municipality, province, status) VALUES
(
    '30000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Célula Maculusso',
    'Célula de jovens e adultos na região do Maculusso',
    '20000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000003',
    'Quarta',
    '19:00:00',
    'Casa da Irmã Maria',
    'Rua das Acácias, 45',
    'Maculusso',
    'Ingombota',
    'Luanda',
    'Luanda',
    'Active'
),
(
    '30000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'Célula Maianga',
    'Célula familiar na região da Maianga',
    '20000000-0000-0000-0000-000000000004',
    NULL,
    'Sexta',
    '18:30:00',
    'Casa do Irmão Carlos',
    'Avenida 4 de Fevereiro, 789',
    'Maianga',
    'Maianga',
    'Luanda',
    'Luanda',
    'Active'
);

-- =====================================================
-- GROUP MEMBERS
-- =====================================================

INSERT INTO group_members (group_id, member_id, role, joined_at) VALUES
-- Célula Maculusso
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Líder', '2023-01-15'),
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'Co-líder', '2023-01-15'),
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', 'Membro', '2023-02-10'),
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000006', 'Membro', '2023-03-05'),
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000008', 'Membro', '2023-04-20'),
-- Célula Maianga
('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000004', 'Líder', '2023-01-20'),
('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000007', 'Membro', '2023-02-15');

-- =====================================================
-- DEPARTMENTS (Default departments for each church)
-- =====================================================

INSERT INTO departments (id, church_id, name, icon, description, leader_id, is_default) VALUES
-- Church 1 - Default Departments
(
    '40000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Secretaria',
    'FileText',
    'Departamento responsável pela administração e documentação',
    '20000000-0000-0000-0000-000000000002',
    true
),
(
    '40000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'Finanças',
    'DollarSign',
    'Departamento responsável pela gestão financeira',
    '20000000-0000-0000-0000-000000000003',
    true
),
(
    '40000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    'Louvor',
    'Music',
    'Departamento de música e louvor',
    '20000000-0000-0000-0000-000000000004',
    true
),
-- Church 1 - Additional Departments
(
    '40000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000001',
    'Jovens',
    'Users',
    'Ministério de jovens',
    '20000000-0000-0000-0000-000000000007',
    false
),
-- Church 2 - Default Departments
(
    '40000000-0000-0000-0000-000000000101',
    '10000000-0000-0000-0000-000000000002',
    'Secretaria',
    'FileText',
    'Departamento responsável pela administração e documentação',
    '20000000-0000-0000-0000-000000000102',
    true
),
(
    '40000000-0000-0000-0000-000000000102',
    '10000000-0000-0000-0000-000000000002',
    'Finanças',
    'DollarSign',
    'Departamento responsável pela gestão financeira',
    NULL,
    true
),
(
    '40000000-0000-0000-0000-000000000103',
    '10000000-0000-0000-0000-000000000002',
    'Louvor',
    'Music',
    'Departamento de música e louvor',
    NULL,
    true
);

-- =====================================================
-- DEPARTMENT MEMBERS
-- =====================================================

INSERT INTO department_members (department_id, member_id, joined_at) VALUES
-- Louvor Department
('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000004', '2023-01-10'),
('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000005', '2023-01-10'),
('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000008', '2023-02-15'),
-- Jovens Department
('40000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000007', '2023-01-15'),
('40000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000008', '2023-01-15');

-- =====================================================
-- SERVICES (CULTOS)
-- =====================================================

INSERT INTO services (id, church_id, name, type, date, start_time, preacher_id, leader_id, location, status, stats_adults_men, stats_adults_women, stats_children_boys, stats_children_girls, stats_visitors_men, stats_visitors_women) VALUES
(
    '50000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Culto de Domingo - Manhã',
    'Culto de Domingo',
    '2024-12-01',
    '09:00:00',
    '20000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002',
    'Templo Principal',
    'Concluído',
    45,
    62,
    18,
    22,
    3,
    2
),
(
    '50000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'Culto de Meio da Semana',
    'Culto de Meio da Semana',
    '2024-11-27',
    '19:00:00',
    '20000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000002',
    'Templo Principal',
    'Concluído',
    28,
    35,
    8,
    10,
    1,
    1
),
(
    '50000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    'Culto de Domingo - Manhã',
    'Culto de Domingo',
    '2024-12-08',
    '09:00:00',
    '20000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002',
    'Templo Principal',
    'Agendado',
    0,
    0,
    0,
    0,
    0,
    0
);

-- =====================================================
-- EVENTS
-- =====================================================

INSERT INTO events (id, church_id, title, description, type, date, start_time, location) VALUES
(
    '60000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Retiro de Jovens 2024',
    'Retiro anual de jovens com tema "Renovação"',
    'Youth',
    '2024-12-15',
    '08:00:00',
    'Centro de Retiros - Benfica'
),
(
    '60000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'Conferência Missionária',
    'Conferência sobre missões e evangelismo',
    'Conference',
    '2024-12-20',
    '18:00:00',
    'Templo Principal'
);

-- =====================================================
-- CHRISTIAN STAGES
-- =====================================================

INSERT INTO christian_stages (church_id, name, description, order_index) VALUES
('10000000-0000-0000-0000-000000000001', 'Novo Convertido', 'Pessoa que acabou de aceitar Jesus', 1),
('10000000-0000-0000-0000-000000000001', 'Discípulo', 'Pessoa em processo de discipulado', 2),
('10000000-0000-0000-0000-000000000001', 'Obreiro', 'Pessoa preparada para servir', 3),
('10000000-0000-0000-0000-000000000001', 'Líder', 'Pessoa capacitada para liderar', 4);

-- =====================================================
-- TEACHING CATEGORIES
-- =====================================================

INSERT INTO teaching_categories (church_id, name, description) VALUES
('10000000-0000-0000-0000-000000000001', 'Homogenia', 'Ensino por faixa etária'),
('10000000-0000-0000-0000-000000000001', 'Adultos', 'Ensino para adultos'),
('10000000-0000-0000-0000-000000000001', 'Jovens', 'Ensino para jovens'),
('10000000-0000-0000-0000-000000000001', 'Adolescentes', 'Ensino para adolescentes'),
('10000000-0000-0000-0000-000000000001', 'Crianças', 'Ensino para crianças');

-- =====================================================
-- TRANSACTION CATEGORIES
-- =====================================================

INSERT INTO transaction_categories (church_id, name, type, is_system) VALUES
-- Income Categories
('10000000-0000-0000-0000-000000000001', 'Dízimos', 'Income', true),
('10000000-0000-0000-0000-000000000001', 'Ofertas', 'Income', true),
('10000000-0000-0000-0000-000000000001', 'Doações', 'Income', true),
('10000000-0000-0000-0000-000000000001', 'Eventos', 'Income', false),
-- Expense Categories
('10000000-0000-0000-0000-000000000001', 'Aluguel', 'Expense', true),
('10000000-0000-0000-0000-000000000001', 'Água e Luz', 'Expense', true),
('10000000-0000-0000-0000-000000000001', 'Salários', 'Expense', true),
('10000000-0000-0000-0000-000000000001', 'Manutenção', 'Expense', false),
('10000000-0000-0000-0000-000000000001', 'Material de Escritório', 'Expense', false),
('10000000-0000-0000-0000-000000000001', 'Missões', 'Expense', false);

-- =====================================================
-- TRANSACTIONS
-- =====================================================

INSERT INTO transactions (church_id, type, category_id, amount, date, source, source_id, description) VALUES
(
    '10000000-0000-0000-0000-000000000001',
    'Income',
    (SELECT id FROM transaction_categories WHERE church_id = '10000000-0000-0000-0000-000000000001' AND name = 'Dízimos' LIMIT 1),
    15000.00,
    '2024-11-24',
    'Service',
    '50000000-0000-0000-0000-000000000001',
    'Dízimos do culto de domingo'
),
(
    '10000000-0000-0000-0000-000000000001',
    'Income',
    (SELECT id FROM transaction_categories WHERE church_id = '10000000-0000-0000-0000-000000000001' AND name = 'Ofertas' LIMIT 1),
    8500.00,
    '2024-11-24',
    'Service',
    '50000000-0000-0000-0000-000000000001',
    'Ofertas do culto de domingo'
),
(
    '10000000-0000-0000-0000-000000000001',
    'Expense',
    (SELECT id FROM transaction_categories WHERE church_id = '10000000-0000-0000-0000-000000000001' AND name = 'Água e Luz' LIMIT 1),
    3200.00,
    '2024-11-25',
    'Other',
    NULL,
    'Pagamento de conta de luz - Novembro'
),
(
    '10000000-0000-0000-0000-000000000001',
    'Expense',
    (SELECT id FROM transaction_categories WHERE church_id = '10000000-0000-0000-0000-000000000001' AND name = 'Material de Escritório' LIMIT 1),
    850.00,
    '2024-11-26',
    'Other',
    NULL,
    'Compra de material de escritório'
);

-- =====================================================
-- DISCIPLESHIP LEADERS
-- =====================================================

INSERT INTO discipleship_leaders (church_id, member_id, start_date) VALUES
('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', '2023-01-10'),
('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', '2023-02-15');

-- =====================================================
-- DISCIPLESHIP RELATIONSHIPS
-- =====================================================

INSERT INTO discipleship_relationships (leader_id, disciple_id, start_date) VALUES
(
    (SELECT id FROM discipleship_leaders WHERE member_id = '20000000-0000-0000-0000-000000000002' LIMIT 1),
    '20000000-0000-0000-0000-000000000005',
    '2023-03-01'
),
(
    (SELECT id FROM discipleship_leaders WHERE member_id = '20000000-0000-0000-0000-000000000002' LIMIT 1),
    '20000000-0000-0000-0000-000000000006',
    '2023-03-15'
),
(
    (SELECT id FROM discipleship_leaders WHERE member_id = '20000000-0000-0000-0000-000000000003' LIMIT 1),
    '20000000-0000-0000-0000-000000000007',
    '2023-04-01'
);
