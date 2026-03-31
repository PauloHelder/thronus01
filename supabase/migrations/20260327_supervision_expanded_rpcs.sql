-- =====================================================
-- EXPANDED RPCs FOR CHILD CHURCH DATA ACCESS (SUPERVISION - PHASE 2)
-- =====================================================

-- 1. Get child church members (if shared)
CREATE OR REPLACE FUNCTION public.get_child_church_members(p_church_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_parent_id UUID;
    v_is_shared BOOLEAN;
BEGIN
    SELECT church_id INTO v_parent_id FROM public.users WHERE id = auth.uid();

    SELECT (settings->'shared_permissions'->>'view_members')::boolean INTO v_is_shared
    FROM public.churches
    WHERE id = p_church_id AND parent_church_id = v_parent_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Igreja não encontrada ou não é sua vinculada.');
    END IF;

    IF v_is_shared IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'error', 'Esta igreja não compartilha lista de membros.');
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'data', (
            SELECT jsonb_agg(m)
            FROM (
                SELECT 
                    id, name, member_code, email, phone, status, church_role, avatar_url
                FROM public.members
                WHERE church_id = p_church_id AND deleted_at IS NULL
                ORDER BY name ASC
            ) m
        )
    );
END;
$$;

-- 2. Get child church departments (if shared)
CREATE OR REPLACE FUNCTION public.get_child_church_departments(p_church_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_parent_id UUID;
    v_is_shared BOOLEAN;
BEGIN
    SELECT church_id INTO v_parent_id FROM public.users WHERE id = auth.uid();

    SELECT (settings->'shared_permissions'->>'view_departments')::boolean INTO v_is_shared
    FROM public.churches
    WHERE id = p_church_id AND parent_church_id = v_parent_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Igreja não encontrada ou não é sua vinculada.');
    END IF;

    IF v_is_shared IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'error', 'Esta igreja não compartilha dados de departamentos.');
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'data', (
            SELECT jsonb_agg(d)
            FROM (
                SELECT 
                    d.id, d.name, d.description, d.icon, 
                    m.name as leader_name
                FROM public.departments d
                LEFT JOIN public.members m ON m.id = d.leader_id
                WHERE d.church_id = p_church_id AND d.deleted_at IS NULL
                ORDER BY d.name ASC
            ) d
        )
    );
END;
$$;

-- 3. Get child church teaching (if shared)
CREATE OR REPLACE FUNCTION public.get_child_church_teaching(p_church_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_parent_id UUID;
    v_is_shared BOOLEAN;
BEGIN
    SELECT church_id INTO v_parent_id FROM public.users WHERE id = auth.uid();

    SELECT (settings->'shared_permissions'->>'view_teaching')::boolean INTO v_is_shared
    FROM public.churches
    WHERE id = p_church_id AND parent_church_id = v_parent_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Igreja não encontrada ou não é sua vinculada.');
    END IF;

    IF v_is_shared IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'error', 'Esta igreja não compartilha dados de ensino.');
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'data', (
            SELECT jsonb_agg(t)
            FROM (
                SELECT 
                    tc.id, tc.name, tc.status, tc.room, tc.start_date, tc.day_of_week, tc.time,
                    m.name as teacher_name
                FROM public.teaching_classes tc
                LEFT JOIN public.members m ON m.id = tc.teacher_id
                WHERE tc.church_id = p_church_id AND tc.deleted_at IS NULL
                ORDER BY tc.start_date DESC
            ) t
        )
    );
END;
$$;

-- 4. Get child church discipleship (if shared)
CREATE OR REPLACE FUNCTION public.get_child_church_discipleship(p_church_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_parent_id UUID;
    v_is_shared BOOLEAN;
BEGIN
    SELECT church_id INTO v_parent_id FROM public.users WHERE id = auth.uid();

    SELECT (settings->'shared_permissions'->>'view_discipleship')::boolean INTO v_is_shared
    FROM public.churches
    WHERE id = p_church_id AND parent_church_id = v_parent_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Igreja não encontrada ou não é sua vinculada.');
    END IF;

    IF v_is_shared IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'error', 'Esta igreja não compartilha dados de discipulado.');
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'data', (
            SELECT jsonb_agg(dm)
            FROM (
                SELECT 
                    dm.id, dm.date, dm.status, dm.notes,
                    m.name as leader_name
                FROM public.discipleship_meetings dm
                JOIN public.discipleship_leaders dl ON dl.id = dm.leader_id
                JOIN public.members m ON m.id = dl.member_id
                WHERE dl.church_id = p_church_id
                ORDER BY dm.date DESC
            ) dm
        )
    );
END;
$$;

-- 5. Get child church events (if shared)
CREATE OR REPLACE FUNCTION public.get_child_church_events(p_church_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_parent_id UUID;
    v_is_shared BOOLEAN;
BEGIN
    SELECT church_id INTO v_parent_id FROM public.users WHERE id = auth.uid();

    SELECT (settings->'shared_permissions'->>'view_events')::boolean INTO v_is_shared
    FROM public.churches
    WHERE id = p_church_id AND parent_church_id = v_parent_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Igreja não encontrada ou não é sua vinculada.');
    END IF;

    IF v_is_shared IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'error', 'Esta igreja não compartilha dados de eventos.');
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'data', (
            SELECT jsonb_agg(e)
            FROM (
                SELECT 
                    id, title, description, type, date, start_time, location
                FROM public.events
                WHERE church_id = p_church_id AND deleted_at IS NULL
                ORDER BY date DESC
            ) e
        )
    );
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION public.get_child_church_members(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_child_church_departments(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_child_church_teaching(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_child_church_discipleship(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_child_church_events(UUID) TO authenticated;
