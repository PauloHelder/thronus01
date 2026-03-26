-- =====================================================
-- MULTI-TENANT (MULTI-CHURCH) SUPPORT
-- =====================================================

-- 1. Create user_churches mapping table
CREATE TABLE IF NOT EXISTS public.user_churches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    role VARCHAR(50) DEFAULT 'member',
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, church_id)
);

CREATE INDEX IF NOT EXISTS idx_user_churches_user ON public.user_churches(user_id);
CREATE INDEX IF NOT EXISTS idx_user_churches_church ON public.user_churches(church_id);

-- 2. Migrate existing users safely
INSERT INTO public.user_churches (user_id, church_id, member_id, role, permissions)
SELECT id, church_id, member_id, role, permissions 
FROM public.users
ON CONFLICT (user_id, church_id) DO NOTHING;

-- 3. Create function to switch active church without breaking RLS
CREATE OR REPLACE FUNCTION public.switch_active_church(p_church_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_church RECORD;
BEGIN
    -- Obter vínculo usando token/session atual
    SELECT * INTO v_user_church
    FROM public.user_churches
    WHERE user_id = auth.uid() AND church_id = p_church_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Você não tem acesso a esta igreja.');
    END IF;

    -- Atualiza contexto da sessão ativa
    UPDATE public.users
    SET 
        church_id = v_user_church.church_id,
        member_id = v_user_church.member_id,
        role = v_user_church.role,
        permissions = v_user_church.permissions,
        updated_at = NOW()
    WHERE id = auth.uid();

    RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.switch_active_church TO authenticated;

-- 4. Atualiza a função complete_signup para espelhar na tabela user_churches
CREATE OR REPLACE FUNCTION public.complete_signup(
    p_user_id UUID,
    p_email TEXT,
    p_church_name TEXT,
    p_church_slug TEXT,
    p_phone TEXT,
    p_address TEXT,
    p_neighborhood TEXT,
    p_district TEXT,
    p_province TEXT,
    p_settings JSONB,
    p_full_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_church_id UUID;
    v_member_id UUID;
BEGIN
    INSERT INTO churches (
        name, slug, email, phone, address, neighborhood, district, province,
        plan_id, subscription_status, settings
    ) VALUES (
        p_church_name, p_church_slug, p_email, p_phone, p_address, p_neighborhood, p_district, p_province,
        '00000000-0000-0000-0000-000000000001', 'trial', p_settings
    ) RETURNING id INTO v_church_id;

    INSERT INTO members (
        church_id, name, email, phone, status, church_role, is_baptized
    ) VALUES (
        v_church_id, p_full_name, p_email, p_phone, 'Active', 'Pastor', true
    ) RETURNING id INTO v_member_id;

    -- Faz Upsert na tabela de sessão (users)
    INSERT INTO users (id, church_id, member_id, email, role, permissions)
    VALUES (p_user_id, v_church_id, v_member_id, p_email, 'admin', '{}')
    ON CONFLICT (id) DO UPDATE SET
        church_id = EXCLUDED.church_id,
        role = EXCLUDED.role,
        permissions = EXCLUDED.permissions,
        member_id = EXCLUDED.member_id;

    -- Adiciona na tabela de múltiplos acessos
    INSERT INTO public.user_churches (user_id, church_id, member_id, role, permissions)
    VALUES (p_user_id, v_church_id, v_member_id, 'admin', '{}')
    ON CONFLICT (user_id, church_id) DO NOTHING;

    INSERT INTO departments (church_id, name, icon, description, is_default) VALUES
    (v_church_id, 'Secretaria', 'FileText', 'Administração', true),
    (v_church_id, 'Finanças', 'DollarSign', 'Gestão Financeira', true),
    (v_church_id, 'Louvor', 'Music', 'Música e Adoração', true);

    INSERT INTO transaction_categories (church_id, name, type, is_system) VALUES
    (v_church_id, 'Dízimos', 'Income', true),
    (v_church_id, 'Ofertas', 'Income', true),
    (v_church_id, 'Doações', 'Income', true),
    (v_church_id, 'Aluguel', 'Expense', true),
    (v_church_id, 'Água e Luz', 'Expense', true),
    (v_church_id, 'Salários', 'Expense', true);

    INSERT INTO christian_stages (church_id, name, order_index) VALUES
    (v_church_id, 'Novo Convertido', 1),
    (v_church_id, 'Membro', 2),
    (v_church_id, 'Líder', 3);

    INSERT INTO teaching_categories (church_id, name) VALUES
    (v_church_id, 'Geral'),
    (v_church_id, 'Liderança'),
    (v_church_id, 'Infantil');

    RETURN jsonb_build_object('success', true, 'church_id', v_church_id);

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 5. Cria RPC de Vinculação Rápida sem senha: link_existing_user
CREATE OR REPLACE FUNCTION public.link_existing_user(
    p_email TEXT,
    p_church_name TEXT,
    p_church_slug TEXT,
    p_phone TEXT,
    p_address TEXT,
    p_neighborhood TEXT,
    p_district TEXT,
    p_province TEXT,
    p_settings JSONB,
    p_full_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_church_id UUID;
    v_member_id UUID;
BEGIN
    -- Encontra usuário autenticado e verifica e-mail para ter certeza de quem ele é
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Usuário não encontrado.');
    END IF;

    -- Cria o Tenant
    INSERT INTO churches (
        name, slug, email, phone, address, neighborhood, district, province,
        plan_id, subscription_status, settings
    ) VALUES (
        p_church_name, p_church_slug, p_email, p_phone, p_address, p_neighborhood, p_district, p_province,
        '00000000-0000-0000-0000-000000000001', 'trial', p_settings
    ) RETURNING id INTO v_church_id;

    -- Cria Membro
    INSERT INTO members (
        church_id, name, email, phone, status, church_role, is_baptized
    ) VALUES (
        v_church_id, p_full_name, p_email, p_phone, 'Active', 'Pastor', true
    ) RETURNING id INTO v_member_id;

    -- Atualiza sessão ativa
    INSERT INTO users (id, church_id, member_id, email, role, permissions)
    VALUES (v_user_id, v_church_id, v_member_id, p_email, 'admin', '{}')
    ON CONFLICT (id) DO UPDATE SET
        church_id = EXCLUDED.church_id,
        member_id = EXCLUDED.member_id,
        role = EXCLUDED.role,
        permissions = EXCLUDED.permissions;

    -- Vincula à tabela multi-tenant
    INSERT INTO public.user_churches (user_id, church_id, member_id, role, permissions)
    VALUES (v_user_id, v_church_id, v_member_id, 'admin', '{}')
    ON CONFLICT (user_id, church_id) DO UPDATE SET
        member_id = EXCLUDED.member_id,
        role = EXCLUDED.role,
        permissions = EXCLUDED.permissions;

    -- Seeds da Nova Igreja
    INSERT INTO departments (church_id, name, icon, description, is_default) VALUES
    (v_church_id, 'Secretaria', 'FileText', 'Administração', true),
    (v_church_id, 'Finanças', 'DollarSign', 'Gestão Financeira', true),
    (v_church_id, 'Louvor', 'Music', 'Música e Adoração', true);

    INSERT INTO transaction_categories (church_id, name, type, is_system) VALUES
    (v_church_id, 'Dízimos', 'Income', true),
    (v_church_id, 'Ofertas', 'Income', true),
    (v_church_id, 'Doações', 'Income', true),
    (v_church_id, 'Aluguel', 'Expense', true),
    (v_church_id, 'Água e Luz', 'Expense', true),
    (v_church_id, 'Salários', 'Expense', true);

    INSERT INTO christian_stages (church_id, name, order_index) VALUES
    (v_church_id, 'Novo Convertido', 1),
    (v_church_id, 'Membro', 2),
    (v_church_id, 'Líder', 3);

    INSERT INTO teaching_categories (church_id, name) VALUES
    (v_church_id, 'Geral'),
    (v_church_id, 'Liderança'),
    (v_church_id, 'Infantil');

    RETURN jsonb_build_object('success', true, 'church_id', v_church_id);

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_existing_user TO anon, authenticated, service_role;

-- 6. Atualização do admin_create_user_entry para também cadastrar em user_churches
CREATE OR REPLACE FUNCTION public.admin_create_user_entry(
    p_user_id UUID,
    p_email TEXT,
    p_role TEXT,
    p_name TEXT,
    p_phone TEXT DEFAULT NULL,
    p_member_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_church_id UUID;
    v_current_role TEXT;
    v_final_member_id UUID;
BEGIN
    SELECT church_id, role INTO v_church_id, v_current_role 
    FROM users 
    WHERE id = auth.uid();
    
    IF v_church_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated or not in a church';
    END IF;

    IF v_current_role = 'admin' THEN
        NULL;
    ELSIF v_current_role = 'supervisor' THEN
        IF p_role IN ('admin', 'supervisor') THEN
            RAISE EXCEPTION 'Supervisors cannot create Admins or other Supervisors';
        END IF;
    ELSIF v_current_role = 'leader' THEN
        IF p_role <> 'member' THEN
            RAISE EXCEPTION 'Leaders can only create Members';
        END IF;
    ELSE
        RAISE EXCEPTION 'Permission denied';
    END IF;

    IF p_member_id IS NOT NULL THEN
        v_final_member_id := p_member_id;
        PERFORM 1 FROM members WHERE id = p_member_id AND church_id = v_church_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Member not found or does not belong to your church';
        END IF;
    ELSE
        INSERT INTO members (church_id, name, email, phone, status, church_role)
        VALUES (v_church_id, p_name, p_email, p_phone, 'Active', 'Member')
        RETURNING id INTO v_final_member_id;
    END IF;

    -- Update/Insert in users table
    INSERT INTO users (id, church_id, member_id, email, role)
    VALUES (p_user_id, v_church_id, v_final_member_id, p_email, p_role)
    ON CONFLICT (id) DO UPDATE 
    SET role = EXCLUDED.role,
        member_id = v_final_member_id;

    -- Add to user_churches mapping
    INSERT INTO public.user_churches (user_id, church_id, member_id, role, permissions)
    VALUES (p_user_id, v_church_id, v_final_member_id, p_role, jsonb_build_object('roles', jsonb_build_array(p_role)))
    ON CONFLICT (user_id, church_id) DO UPDATE 
    SET role = EXCLUDED.role,
        member_id = v_final_member_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_create_user_entry(UUID, TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;


-- 7. Função para administradores vincularem um email existente à sua igreja
CREATE OR REPLACE FUNCTION public.admin_add_existing_user_by_email(
    p_email TEXT,
    p_role VARCHAR(50),
    p_name TEXT,
    p_phone TEXT DEFAULT NULL,
    p_member_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_church_id UUID;
    v_current_role TEXT;
    v_final_member_id UUID;
BEGIN
    SELECT church_id, role INTO v_church_id, v_current_role 
    FROM users 
    WHERE id = auth.uid();
    
    IF v_church_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Você não está vinculado a nenhuma igreja.');
    END IF;

    -- Perm check
    IF v_current_role NOT IN ('admin', 'supervisor', 'leader') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Permissão negada.');
    END IF;
    
    -- Find the target user by email
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Usuário não existe no sistema global.');
    END IF;

    -- Handle member mapping
    IF p_member_id IS NOT NULL THEN
        v_final_member_id := p_member_id;
        PERFORM 1 FROM members WHERE id = p_member_id AND church_id = v_church_id;
        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'error', 'Membro não encontrado.');
        END IF;
    ELSE
        INSERT INTO members (church_id, name, email, phone, status, church_role)
        VALUES (v_church_id, p_name, p_email, p_phone, 'Active', 'Member')
        RETURNING id INTO v_final_member_id;
    END IF;

    -- Add to user_churches for this tenant
    INSERT INTO public.user_churches (user_id, church_id, member_id, role, permissions)
    VALUES (v_user_id, v_church_id, v_final_member_id, p_role, jsonb_build_object('roles', jsonb_build_array(p_role)))
    ON CONFLICT (user_id, church_id) DO UPDATE SET 
        role = EXCLUDED.role,
        permissions = EXCLUDED.permissions,
        member_id = EXCLUDED.member_id;

    -- Also verify if they have an active session in users table, if not, insert them
    INSERT INTO public.users (id, church_id, email, role, member_id, permissions)
    VALUES (v_user_id, v_church_id, p_email, p_role, v_final_member_id, jsonb_build_object('roles', jsonb_build_array(p_role)))
    ON CONFLICT (id) DO NOTHING;

    RETURN jsonb_build_object('success', true, 'user_id', v_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_add_existing_user_by_email(TEXT, VARCHAR(50), TEXT, TEXT, UUID) TO authenticated;

-- 8. Função para listar todos os usuários de uma igreja específica (Multi-Tenant)
CREATE OR REPLACE FUNCTION public.get_church_users(p_church_id UUID)
RETURNS TABLE (
    id UUID,
    email TEXT,
    role VARCHAR,
    permissions JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    member JSONB
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uc.user_id AS id,
        u.email::TEXT,
        uc.role::VARCHAR,
        uc.permissions,
        uc.created_at,
        CASE
            WHEN m.id IS NOT NULL THEN
                jsonb_build_object(
                    'name', m.name,
                    'avatar_url', m.avatar_url,
                    'phone', m.phone
                )
            ELSE null
        END AS member
    FROM public.user_churches uc
    JOIN public.users u ON u.id = uc.user_id
    LEFT JOIN public.members m ON m.id = uc.member_id
    WHERE uc.church_id = p_church_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_church_users(UUID) TO authenticated;

-- ============================================================
-- 9. DESATIVAÇÃO DE USUÁRIOS
-- ============================================================

-- 9a. Adicionar coluna is_active na tabela user_churches
ALTER TABLE public.user_churches ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 9b. Atualizar switch_active_church para bloquear igrejas inativas
CREATE OR REPLACE FUNCTION public.switch_active_church(p_church_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_church RECORD;
BEGIN
    SELECT * INTO v_user_church
    FROM public.user_churches
    WHERE user_id = auth.uid() AND church_id = p_church_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Você não tem acesso a esta igreja.');
    END IF;

    IF v_user_church.is_active = false THEN
        RETURN jsonb_build_object('success', false, 'error', 'Seu acesso a esta igreja foi desativado. Contate o administrador.');
    END IF;

    UPDATE public.users
    SET 
        church_id = v_user_church.church_id,
        member_id = v_user_church.member_id,
        role = v_user_church.role,
        permissions = v_user_church.permissions,
        updated_at = NOW()
    WHERE id = auth.uid();

    RETURN jsonb_build_object('success', true);
END;
$$;

-- 9c. Atualizar get_church_users para retornar is_active
DROP FUNCTION IF EXISTS public.get_church_users(UUID);
CREATE OR REPLACE FUNCTION public.get_church_users(p_church_id UUID)
RETURNS TABLE (
    id UUID,
    email TEXT,
    role VARCHAR,
    permissions JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN,
    member JSONB
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uc.user_id AS id,
        u.email::TEXT,
        uc.role::VARCHAR,
        uc.permissions,
        uc.created_at,
        uc.is_active,
        CASE
            WHEN m.id IS NOT NULL THEN
                jsonb_build_object(
                    'name', m.name,
                    'avatar_url', m.avatar_url,
                    'phone', m.phone
                )
            ELSE null
        END AS member
    FROM public.user_churches uc
    JOIN public.users u ON u.id = uc.user_id
    LEFT JOIN public.members m ON m.id = uc.member_id
    WHERE uc.church_id = p_church_id;
END;
$$;

-- 9d. Função para ativar/desativar um usuário em uma igreja
CREATE OR REPLACE FUNCTION public.toggle_user_active(p_user_id UUID, p_church_id UUID, p_active BOOLEAN)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar se o chamador é admin nesta igreja
    IF NOT EXISTS (
        SELECT 1 FROM public.user_churches
        WHERE user_id = auth.uid() AND church_id = p_church_id AND role = 'admin'
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Apenas administradores podem alterar o status de usuários.');
    END IF;

    -- Não permitir desativar a si mesmo
    IF p_user_id = auth.uid() AND p_active = false THEN
        RETURN jsonb_build_object('success', false, 'error', 'Você não pode desativar sua própria conta.');
    END IF;

    UPDATE public.user_churches
    SET is_active = p_active
    WHERE user_id = p_user_id AND church_id = p_church_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Vínculo não encontrado.');
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_user_active(UUID, UUID, BOOLEAN) TO authenticated;
