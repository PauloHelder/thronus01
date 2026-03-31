-- =====================================================
-- RPCs FOR CHILD CHURCH DATA ACCESS (SUPERVISION)
-- =====================================================

-- 1. Get child church services (if shared)
CREATE OR REPLACE FUNCTION public.get_child_church_services(p_church_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_parent_id UUID;
    v_is_shared BOOLEAN;
BEGIN
    -- Obter a igreja mãe do usuário atual (sessão ativa)
    SELECT church_id INTO v_parent_id FROM public.users WHERE id = auth.uid();

    -- Verificar se a igreja solicitada é filha da igreja do usuário
    -- E se a permissão 'view_service_stats' está ativa
    SELECT (settings->'shared_permissions'->>'view_service_stats')::boolean INTO v_is_shared
    FROM public.churches
    WHERE id = p_church_id AND parent_church_id = v_parent_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Igreja não encontrada ou não é sua vinculada.');
    END IF;

    IF v_is_shared IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'error', 'Esta igreja não compartilha estatísticas de cultos.');
    END IF;

    -- Retornar a lista de cultos
    RETURN jsonb_build_object(
        'success', true,
        'data', (
            SELECT jsonb_agg(s)
            FROM (
                SELECT 
                    id, 
                    church_id, 
                    service_type_id,
                    status,
                    date,
                    start_time,
                    preacher_name,
                    leader_name,
                    location,
                    description,
                    stats_adults_men,
                    stats_adults_women,
                    stats_children_boys,
                    stats_children_girls,
                    stats_visitors_men,
                    stats_visitors_women
                FROM public.services
                WHERE church_id = p_church_id AND deleted_at IS NULL
                ORDER BY date DESC
            ) s
        )
    );
END;
$$;

-- 2. Get child church finances (if shared)
CREATE OR REPLACE FUNCTION public.get_child_church_finances(p_church_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_parent_id UUID;
    v_is_shared BOOLEAN;
BEGIN
    -- Obter a igreja mãe do usuário atual (sessão ativa)
    SELECT church_id INTO v_parent_id FROM public.users WHERE id = auth.uid();

    -- Verificar se a igreja solicitada é filha da igreja do usuário
    -- E se a permissão 'view_finances' está ativa
    SELECT (settings->'shared_permissions'->>'view_finances')::boolean INTO v_is_shared
    FROM public.churches
    WHERE id = p_church_id AND parent_church_id = v_parent_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Igreja não encontrada ou não é sua vinculada.');
    END IF;

    IF v_is_shared IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'error', 'Esta igreja não compartilha dados financeiros.');
    END IF;

    -- Retornar resumo financeiro
    RETURN jsonb_build_object(
        'success', true,
        'data', (
            SELECT jsonb_build_object(
                'total_income', COALESCE(SUM(amount) FILTER (WHERE type = 'Income'), 0),
                'total_expense', COALESCE(SUM(amount) FILTER (WHERE type = 'Expense'), 0),
                'balance', COALESCE(SUM(CASE WHEN type = 'Income' THEN amount ELSE -amount END), 0),
                'recent_transactions', (
                    SELECT jsonb_agg(t)
                    FROM (
                        SELECT type, amount, date, description
                        FROM public.transactions
                        WHERE church_id = p_church_id AND deleted_at IS NULL
                        ORDER BY date DESC
                        LIMIT 5
                    ) t
                )
            )
            FROM public.transactions
            WHERE church_id = p_church_id AND deleted_at IS NULL
        )
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_child_church_services(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_child_church_finances(UUID) TO authenticated;
