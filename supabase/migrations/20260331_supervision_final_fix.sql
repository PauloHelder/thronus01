-- =====================================================
-- FINAL FIXES FOR CHILD CHURCH DATA ACCESS (SUPERVISION - V4)
-- =====================================================

-- 1. Get supervised churches with REAL stats (Unified List)
CREATE OR REPLACE FUNCTION public.get_supervised_churches_with_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_parent_id UUID;
BEGIN
    -- Obter a igreja do usuário atual (Supervisor)
    SELECT church_id INTO v_parent_id FROM public.users WHERE id = auth.uid();

    RETURN jsonb_build_object(
        'success', true,
        'data', (
            SELECT jsonb_agg(c)
            FROM (
                SELECT 
                    ch.id, ch.name, ch.slug, ch.settings, ch.created_at,
                    (SELECT COUNT(*) FROM public.members mb WHERE mb.church_id = ch.id AND mb.deleted_at IS NULL) as real_member_count,
                    (SELECT COUNT(*) FROM public.services sv WHERE sv.church_id = ch.id AND sv.deleted_at IS NULL) as real_service_count,
                    (SELECT COUNT(*) FROM public.groups gp WHERE gp.church_id = ch.id AND gp.deleted_at IS NULL) as real_group_count,
                    (SELECT COALESCE(SUM(stats_new_converts_men + stats_new_converts_women + stats_new_converts_children), 0) FROM public.services sv WHERE sv.church_id = ch.id AND sv.deleted_at IS NULL) as real_converts_count
                FROM public.churches ch
                WHERE ch.parent_id = v_parent_id
                ORDER BY ch.name ASC
            ) c
        )
    );
END;
$$;

-- 2. Fixed Finances RPC (Case-sensitivity + Monthly Balance)
CREATE OR REPLACE FUNCTION public.get_child_church_finances(p_church_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_parent_id UUID;
    v_is_shared BOOLEAN;
    v_month_start DATE := date_trunc('month', now())::date;
BEGIN
    SELECT church_id INTO v_parent_id FROM public.users WHERE id = auth.uid();

    -- Check if church is child and shares finances
    SELECT (settings->'shared_permissions'->>'view_finances')::boolean INTO v_is_shared
    FROM public.churches
    WHERE id = p_church_id AND parent_id = v_parent_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Igreja não encontrada ou não é sua vinculada.');
    END IF;

    IF v_is_shared IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'error', 'Esta igreja não compartilha dados financeiros.');
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'data', (
            SELECT jsonb_build_object(
                'total_income', COALESCE(SUM(amount) FILTER (WHERE type = 'income' AND date >= v_month_start), 0),
                'total_expense', COALESCE(SUM(amount) FILTER (WHERE type = 'expense' AND date >= v_month_start), 0),
                'balance', COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) FILTER (WHERE date >= v_month_start), 0),
                'all_time_balance', COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0),
                'recent_transactions', (
                    SELECT jsonb_agg(t)
                    FROM (
                        SELECT type, amount, date, description
                        FROM public.financial_transactions
                        WHERE church_id = p_church_id AND deleted_at IS NULL
                        ORDER BY date DESC
                        LIMIT 10
                    ) t
                )
            )
            FROM public.financial_transactions
            WHERE church_id = p_church_id AND deleted_at IS NULL
        )
    );
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION public.get_supervised_churches_with_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_child_church_finances(UUID) TO authenticated;
