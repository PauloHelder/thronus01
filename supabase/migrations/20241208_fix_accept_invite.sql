-- FIX: accept_invite should match existing member if email exists, instead of creating duplicate.
CREATE OR REPLACE FUNCTION accept_invite(
    p_token UUID,
    p_user_id UUID,
    p_full_name TEXT,
    p_phone TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_invite RECORD;
    v_existing_member_id UUID;
BEGIN
    -- Get Invite
    SELECT * INTO v_invite FROM user_invites 
    WHERE token = p_token AND status = 'pending' AND expires_at > NOW();

    IF v_invite IS NULL THEN
        RAISE EXCEPTION 'Invalid or expired invite';
    END IF;

    -- Check if a member with this email already exists in this church
    SELECT id INTO v_existing_member_id FROM members 
    WHERE church_id = v_invite.church_id AND email = v_invite.email
    LIMIT 1;

    IF v_existing_member_id IS NOT NULL THEN
        -- Link to EXISTING member
        INSERT INTO users (id, church_id, member_id, email, role)
        VALUES (p_user_id, v_invite.church_id, v_existing_member_id, v_invite.email, v_invite.role);
        
        -- Optionally update member name/phone if provided and empty?
        -- UPDATE members SET name = p_full_name WHERE id = v_existing_member_id AND (name IS NULL OR name = '');
    ELSE
        -- Create NEW member
        WITH new_member AS (
            INSERT INTO members (church_id, name, email, phone, status, church_role)
            VALUES (v_invite.church_id, p_full_name, v_invite.email, p_phone, 'Active', 'Member')
            RETURNING id
        )
        INSERT INTO users (id, church_id, member_id, email, role)
        SELECT p_user_id, v_invite.church_id, new_member.id, v_invite.email, v_invite.role
        FROM new_member;
    END IF;

    -- Update Invite Status
    UPDATE user_invites SET status = 'accepted' WHERE id = v_invite.id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
