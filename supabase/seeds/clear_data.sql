-- =====================================================
-- THRONUS V5 - CLEAR ALL DATA
-- Remove todos os dados mock mantendo a estrutura
-- =====================================================

-- Desabilitar triggers temporariamente para evitar problemas
SET session_replication_role = 'replica';

-- =====================================================
-- LIMPAR DADOS (em ordem reversa de dependências)
-- =====================================================

-- Audit Logs
TRUNCATE TABLE audit_logs CASCADE;

-- Finance
TRUNCATE TABLE transactions CASCADE;
TRUNCATE TABLE transaction_categories CASCADE;

-- Discipleship
TRUNCATE TABLE discipleship_meeting_attendance CASCADE;
TRUNCATE TABLE discipleship_meetings CASCADE;
TRUNCATE TABLE discipleship_relationships CASCADE;
TRUNCATE TABLE discipleship_leaders CASCADE;

-- Teaching
TRUNCATE TABLE teaching_lesson_attendance CASCADE;
TRUNCATE TABLE teaching_lessons CASCADE;
TRUNCATE TABLE teaching_class_students CASCADE;
TRUNCATE TABLE teaching_classes CASCADE;
TRUNCATE TABLE teaching_categories CASCADE;
TRUNCATE TABLE christian_stages CASCADE;

-- Events
TRUNCATE TABLE event_attendees CASCADE;
TRUNCATE TABLE events CASCADE;

-- Departments
TRUNCATE TABLE department_schedule_assignments CASCADE;
TRUNCATE TABLE department_schedules CASCADE;
TRUNCATE TABLE department_members CASCADE;
TRUNCATE TABLE departments CASCADE;

-- Services
TRUNCATE TABLE services CASCADE;

-- Groups
TRUNCATE TABLE group_meeting_attendance CASCADE;
TRUNCATE TABLE group_meetings CASCADE;
TRUNCATE TABLE group_members CASCADE;
TRUNCATE TABLE groups CASCADE;

-- Members and Users
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE members CASCADE;

-- Subscriptions
TRUNCATE TABLE subscriptions CASCADE;

-- Churches (mantém plans)
TRUNCATE TABLE churches CASCADE;

-- =====================================================
-- MANTER APENAS OS PLANOS
-- =====================================================

-- Limpar planos existentes
TRUNCATE TABLE plans CASCADE;

-- Reinserir os 3 planos básicos
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

-- Reabilitar triggers
SET session_replication_role = 'origin';

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Mostrar contagem de registros
SELECT 'Plans' as table_name, COUNT(*) as count FROM plans
UNION ALL
SELECT 'Churches', COUNT(*) FROM churches
UNION ALL
SELECT 'Members', COUNT(*) FROM members
UNION ALL
SELECT 'Groups', COUNT(*) FROM groups
UNION ALL
SELECT 'Departments', COUNT(*) FROM departments
UNION ALL
SELECT 'Services', COUNT(*) FROM services
UNION ALL
SELECT 'Events', COUNT(*) FROM events
UNION ALL
SELECT 'Transactions', COUNT(*) FROM transactions;

-- Resultado esperado:
-- Plans: 3
-- Todas as outras: 0
