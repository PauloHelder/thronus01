-- =====================================================
-- SCRIPT DE REPARO AUTOMÁTICO DE LOGIN
-- Este script encontra usuários que existem no Auth mas não no banco
-- e cria os dados necessários para eles conseguirem logar.
-- =====================================================

DO $$
DECLARE
    r RECORD;
    v_church_id UUID;
    v_member_id UUID;
    v_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Iniciando verificação de usuários órfãos...';

    -- Loop por todos os usuários do Auth que NÃO têm registro na tabela users
    FOR r IN 
        SELECT au.id, au.email, au.created_at
        FROM auth.users au
        LEFT JOIN users u ON au.id = u.id
        WHERE u.id IS NULL
    LOOP
        RAISE NOTICE '🔧 Consertando usuário: % (ID: %)', r.email, r.id;

        -- 1. Criar Igreja de Recuperação (se não existir uma igreja para este email)
        SELECT id INTO v_church_id FROM churches WHERE email = r.email LIMIT 1;

        IF v_church_id IS NULL THEN
            INSERT INTO churches (
                name, slug, email, phone, address, neighborhood, district, province, 
                plan_id, subscription_status, settings
            ) VALUES (
                'Igreja Recuperada - ' || split_part(r.email, '@', 1), -- Nome baseado no email
                'recuperada-' || substr(md5(random()::text), 1, 6),
                r.email,
                '+244 900 000 000',
                'Endereço a atualizar',
                'Bairro a atualizar',
                'Município a atualizar',
                'Luanda',
                '00000000-0000-0000-0000-000000000001', -- Plano Free
                'active',
                '{"categoria": "Sede", "origem": "script_reparo"}'
            ) RETURNING id INTO v_church_id;
            
            -- Criar departamentos padrão
            INSERT INTO departments (church_id, name, icon, is_default) VALUES
            (v_church_id, 'Secretaria', 'FileText', true),
            (v_church_id, 'Finanças', 'DollarSign', true),
            (v_church_id, 'Louvor', 'Music', true);
        END IF;

        -- 2. Criar Membro (Pastor)
        SELECT id INTO v_member_id FROM members WHERE email = r.email AND church_id = v_church_id LIMIT 1;

        IF v_member_id IS NULL THEN
            INSERT INTO members (
                church_id, name, email, phone, status, church_role, is_baptized
            ) VALUES (
                v_church_id,
                'Pastor (Recuperado)',
                r.email,
                '+244 900 000 000',
                'Active',
                'Pastor',
                true
            ) RETURNING id INTO v_member_id;
        END IF;

        -- 3. Criar Vínculo de Usuário (O passo principal que faltava)
        INSERT INTO users (
            id, church_id, member_id, email, role, permissions
        ) VALUES (
            r.id,
            v_church_id,
            v_member_id,
            r.email,
            'admin',
            '{"reparado": true}'
        );

        v_count := v_count + 1;
    END LOOP;

    RAISE NOTICE '✅ Processo concluído. % usuários foram reparados.', v_count;
    
    IF v_count = 0 THEN
        RAISE NOTICE '👍 Nenhum usuário órfão encontrado. O problema pode ser senha incorreta ou email não confirmado.';
    END IF;

END $$;
