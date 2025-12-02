-- =====================================================
-- SCRIPT DE CORREÇÃO PARA: mvidaegraca21@gmail.com
-- =====================================================

DO $$
DECLARE
    v_user_id UUID;
    v_church_id UUID;
    v_member_id UUID;
    v_email TEXT := 'mvidaegraca21@gmail.com';
BEGIN
    -- 1. Buscar ID do usuário no Auth
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não encontrado no Auth! Crie o usuário primeiro no menu Authentication.';
    END IF;

    RAISE NOTICE 'Usuário Auth encontrado: %', v_user_id;

    -- 2. Verificar/Criar Igreja
    SELECT id INTO v_church_id FROM churches WHERE email = v_email;

    IF v_church_id IS NULL THEN
        INSERT INTO churches (
            name, slug, email, phone, address, neighborhood, district, province, 
            plan_id, subscription_status, settings
        ) VALUES (
            'Igreja Vida e Graça', -- Nome genérico
            'vida-e-graca',        -- Slug
            v_email,
            '+244 900 000 000',
            'Endereço não informado',
            'Bairro não informado',
            'Município não informado',
            'Luanda',
            '00000000-0000-0000-0000-000000000001', -- Plano Free
            'active',
            '{"categoria": "Sede"}'
        ) RETURNING id INTO v_church_id;
        
        RAISE NOTICE 'Igreja criada com ID: %', v_church_id;
        
        -- Criar departamentos padrão
        INSERT INTO departments (church_id, name, icon, is_default) VALUES
        (v_church_id, 'Secretaria', 'FileText', true),
        (v_church_id, 'Finanças', 'DollarSign', true),
        (v_church_id, 'Louvor', 'Music', true);
    ELSE
        RAISE NOTICE 'Igreja já existe: %', v_church_id;
    END IF;

    -- 3. Verificar/Criar Membro (Pastor)
    SELECT id INTO v_member_id FROM members WHERE email = v_email AND church_id = v_church_id;

    IF v_member_id IS NULL THEN
        INSERT INTO members (
            church_id, name, email, phone, status, church_role, is_baptized
        ) VALUES (
            v_church_id,
            'Pastor (Vida e Graça)',
            v_email,
            '+244 900 000 000',
            'Active',
            'Pastor',
            true
        ) RETURNING id INTO v_member_id;
        RAISE NOTICE 'Membro criado com ID: %', v_member_id;
    ELSE
        RAISE NOTICE 'Membro já existe: %', v_member_id;
    END IF;

    -- 4. Verificar/Criar Vínculo de Usuário
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = v_user_id) THEN
        INSERT INTO users (
            id, church_id, member_id, email, role, permissions
        ) VALUES (
            v_user_id,
            v_church_id,
            v_member_id,
            v_email,
            'admin',
            '{}'
        );
        RAISE NOTICE 'Vínculo de usuário criado com sucesso!';
    ELSE
        -- Atualizar vínculo se existir mas estiver errado
        UPDATE users 
        SET church_id = v_church_id, member_id = v_member_id, role = 'admin'
        WHERE id = v_user_id;
        RAISE NOTICE 'Vínculo de usuário atualizado.';
    END IF;

END $$;
