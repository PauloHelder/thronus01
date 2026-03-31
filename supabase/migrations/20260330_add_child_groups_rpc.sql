-- 8. Get child church groups
CREATE OR REPLACE FUNCTION public.get_child_church_groups(p_church_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_parent_id UUID;
    v_is_shared BOOLEAN;
BEGIN
    SELECT church_id INTO v_parent_id FROM public.users WHERE id = auth.uid();

    -- In this case we use 'view_groups' permission if it exists, otherwise fallback to 'view_members' or just check if any permission is shared
    -- Since 'view_groups' might not be in the UI yet, let's assume it follows 'view_members' for now or add it to the check
    SELECT (
        COALESCE((settings->'shared_permissions'->>'view_groups')::boolean, (settings->'shared_permissions'->>'view_members')::boolean, false)
    ) INTO v_is_shared
    FROM public.churches
    WHERE id = p_church_id AND parent_id = v_parent_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Igreja não encontrada ou não é sua vinculada.');
    END IF;

    IF v_is_shared IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'error', 'Esta igreja não compartilha dados de células/grupos.');
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'data', (
            SELECT jsonb_agg(g)
            FROM (
                SELECT 
                    g.id, g.name, g.description, g.status, g.meeting_day, g.meeting_time, g.meeting_place,
                    m.name as leader_name,
                    (SELECT COUNT(*) FROM public.group_members gm WHERE gm.group_id = g.id) as member_count
                FROM public.groups g
                LEFT JOIN public.members m ON m.id = g.leader_id
                WHERE g.church_id = p_church_id AND g.deleted_at IS NULL
                ORDER BY g.name ASC
            ) g
        )
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_child_church_groups(UUID) TO authenticated;
