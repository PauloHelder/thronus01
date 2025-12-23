CREATE OR REPLACE FUNCTION create_user_invite(
    p_email TEXT,
    p_role TEXT
) RETURNS UUID AS $$
DECLARE
    v_church_id UUID;
    v_invite_id UUID;
    v_existing_invite_id UUID;
BEGIN
    -- Get current user's church
    SELECT church_id INTO v_church_id FROM users WHERE id = auth.uid();
    IF v_church_id IS NULL THEN RAISE EXCEPTION 'User not in a church'; END IF;

    -- Check permissions
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'leader')) THEN
        RAISE EXCEPTION 'Permission denied';
    END IF;

    -- Check for existing pending invite
    SELECT id INTO v_existing_invite_id 
    FROM user_invites 
    WHERE church_id = v_church_id 
    AND email = p_email 
    AND status = 'pending' 
    AND expires_at > NOW();

    IF v_existing_invite_id IS NOT NULL THEN
        RAISE EXCEPTION 'Já existe um convite ativo para este email. Aguarde a expiração ou exclua o anterior.';
    END IF;

    -- Create Invite
    INSERT INTO user_invites (church_id, email, role, created_by)
    VALUES (v_church_id, p_email, p_role, auth.uid())
    RETURNING id INTO v_invite_id;

    RETURN v_invite_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
