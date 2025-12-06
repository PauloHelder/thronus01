-- =====================================================
-- RESET TOTAL E CRIAÇÃO DE SUPERUSUÁRIO
-- Email: pphelder@gmail.com
-- =====================================================

-- 1. LIMPEZA TOTAL (Mantendo apenas Planos)
-- =====================================================

SET session_replication_role = 'replica';

-- Limpar tabelas
TRUNCATE TABLE audit_logs CASCADE;
TRUNCATE TABLE transactions CASCADE;
TRUNCATE TABLE transaction_categories CASCADE;
TRUNCATE TABLE discipleship_meeting_attendance CASCADE;
TRUNCATE TABLE discipleship_meetings CASCADE;
TRUNCATE TABLE discipleship_relationships CASCADE;
TRUNCATE TABLE discipleship_leaders CASCADE;
TRUNCATE TABLE teaching_lesson_attendance CASCADE;
TRUNCATE TABLE teaching_lessons CASCADE;
TRUNCATE TABLE teaching_class_students CASCADE;
TRUNCATE TABLE teaching_classes CASCADE;
TRUNCATE TABLE teaching_categories CASCADE;
TRUNCATE TABLE christian_stages CASCADE;
TRUNCATE TABLE event_attendees CASCADE;
TRUNCATE TABLE events CASCADE;
TRUNCATE TABLE department_schedule_assignments CASCADE;
TRUNCATE TABLE department_schedules CASCADE;
TRUNCATE TABLE department_members CASCADE;
TRUNCATE TABLE departments CASCADE;
TRUNCATE TABLE services CASCADE;
TRUNCATE TABLE group_meeting_attendance CASCADE;
TRUNCATE TABLE group_meetings CASCADE;
TRUNCATE TABLE group_members CASCADE;
TRUNCATE TABLE groups CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE members CASCADE;
TRUNCATE TABLE subscriptions CASCADE;
TRUNCATE TABLE churches CASCADE;
TRUNCATE TABLE plans CASCADE;

-- Reinserir Planos
INSERT INTO plans (id, name, price, billing_period, features, is_active) VALUES
('00000000-0000-0000-0000-000000000001', 'Free', 0.00, 'monthly', '{"maxMembers": 50}', true),
('00000000-0000-0000-0000-000000000002', 'Profissional', 49.99, 'monthly', '{"maxMembers": 500}', true),
('00000000-0000-0000-0000-000000000003', 'Premium', 99.99, 'monthly', '{"maxMembers": "unlimited"}', true);

SET session_replication_role = 'origin';

-- 2. CRIAÇÃO DO SUPERUSUÁRIO
-- =====================================================

DO $$
DECLARE
    v_user_id UUID;
    v_church_id UUID;
    v_member_id UUID;
    v_email TEXT := 'pphelder@gmail.com';
BEGIN
    -- Buscar ID do usuário no Auth (se existir)
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

    IF v_user_id IS NULL THEN
        RAISE NOTICE '⚠️ Usuário Auth não encontrado para %', v_email;
        RAISE NOTICE '👉 Por favor, crie o usuário no menu Authentication do Supabase primeiro!';
        -- Não podemos continuar sem o ID do Auth
        RETURN;
    END IF;

    RAISE NOTICE '✅ Usuário Auth encontrado: %', v_user_id;

    -- Criar Igreja
    INSERT INTO churches (
        name, slug, email, phone, address, neighborhood, district, province, 
        plan_id, subscription_status, settings
    ) VALUES (
        'Igreja Sede (Superusuário)', 
        'igreja-sede',
        v_email,
        '+244 900 000 000',
        'Rua Principal, 1',
        'Centro',
        'Luanda',
        'Luanda',
        '00000000-0000-0000-0000-000000000003', -- Plano Premium
        'active',
        '{"categoria": "Sede", "is_superuser": true}'
    ) RETURNING id INTO v_church_id;
    
    RAISE NOTICE '✅ Igreja criada com ID: %', v_church_id;

    -- Criar Membro (Pastor/Superusuário)
    INSERT INTO members (
        church_id, name, email, phone, status, church_role, is_baptized
    ) VALUES (
        v_church_id,
        'Super Admin',
        v_email,
        '+244 900 000 000',
        'Active',
        'Pastor',
        true
    ) RETURNING id INTO v_member_id;
    
    RAISE NOTICE '✅ Membro criado com ID: %', v_member_id;

    -- Vincular Usuário
    INSERT INTO users (
        id, church_id, member_id, email, role, permissions
    ) VALUES (
        v_user_id,
        v_church_id,
        v_member_id,
        v_email,
        'admin', -- Role admin (mas com acesso total)
        '{"superuser": true, "all": true}'
    );
    
    RAISE NOTICE '✅ Vínculo de usuário criado com sucesso!';

    -- Criar dados padrão essenciais
    INSERT INTO departments (church_id, name, icon, is_default) VALUES
    (v_church_id, 'Secretaria', 'FileText', true),
    (v_church_id, 'Finanças', 'DollarSign', true),
    (v_church_id, 'Louvor', 'Music', true);

    INSERT INTO transaction_categories (church_id, name, type, is_system) VALUES
    (v_church_id, 'Dízimos', 'Income', true),
    (v_church_id, 'Ofertas', 'Income', true),
    (v_church_id, 'Despesas Gerais', 'Expense', true);

END $$;
