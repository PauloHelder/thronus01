-- =====================================================
-- FUNÇÃO DE CADASTRO SEGURO (RPC)
-- Executa todo o processo de criação de dados com privilégios de admin
-- =====================================================

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
SECURITY DEFINER -- Importante: Roda com permissões de superusuário do banco
AS $$
DECLARE
    v_church_id UUID;
    v_member_id UUID;
BEGIN
    -- 1. Criar Igreja
    INSERT INTO churches (
        name, slug, email, phone, address, neighborhood, district, province,
        plan_id, subscription_status, settings
    ) VALUES (
        p_church_name, p_church_slug, p_email, p_phone, p_address, p_neighborhood, p_district, p_province,
        '00000000-0000-0000-0000-000000000001', 'trial', p_settings
    ) RETURNING id INTO v_church_id;

    -- 2. Criar Membro (Pastor)
    INSERT INTO members (
        church_id, name, email, phone, status, church_role, is_baptized
    ) VALUES (
        v_church_id, p_full_name, p_email, p_phone, 'Active', 'Pastor', true
    ) RETURNING id INTO v_member_id;

    -- 3. Criar Usuário vinculado
    INSERT INTO users (
        id, church_id, member_id, email, role, permissions
    ) VALUES (
        p_user_id, v_church_id, v_member_id, p_email, 'admin', '{}'
    );

    -- 4. Criar dados padrão
    -- Departamentos
    INSERT INTO departments (church_id, name, icon, description, is_default) VALUES
    (v_church_id, 'Secretaria', 'FileText', 'Administração', true),
    (v_church_id, 'Finanças', 'DollarSign', 'Gestão Financeira', true),
    (v_church_id, 'Louvor', 'Music', 'Música e Adoração', true);

    -- Categorias Financeiras
    INSERT INTO transaction_categories (church_id, name, type, is_system) VALUES
    (v_church_id, 'Dízimos', 'Income', true),
    (v_church_id, 'Ofertas', 'Income', true),
    (v_church_id, 'Doações', 'Income', true),
    (v_church_id, 'Aluguel', 'Expense', true),
    (v_church_id, 'Água e Luz', 'Expense', true),
    (v_church_id, 'Salários', 'Expense', true);

    -- Estágios
    INSERT INTO christian_stages (church_id, name, order_index) VALUES
    (v_church_id, 'Novo Convertido', 1),
    (v_church_id, 'Membro', 2),
    (v_church_id, 'Líder', 3);

    -- Categorias de Ensino
    INSERT INTO teaching_categories (church_id, name) VALUES
    (v_church_id, 'Geral'),
    (v_church_id, 'Liderança'),
    (v_church_id, 'Infantil');

    RETURN jsonb_build_object('success', true, 'church_id', v_church_id);

EXCEPTION WHEN OTHERS THEN
    -- Em caso de erro, retorna a mensagem
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Garantir que a função possa ser chamada pela API
GRANT EXECUTE ON FUNCTION public.complete_signup TO anon, authenticated, service_role;
