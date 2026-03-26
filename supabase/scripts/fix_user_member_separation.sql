-- Update function to allow linking to existing member
CREATE OR REPLACE FUNCTION admin_create_user_entry(
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
    -- Get current user context
    SELECT church_id, role INTO v_church_id, v_current_role 
    FROM users 
    WHERE id = auth.uid();
    
    IF v_church_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated or not in a church';
    END IF;

    -- Hierarchy Check
    IF v_current_role = 'admin' THEN
        -- Admin can create anyone (Supervisor, Leader, Member, Custom)
        NULL;
    ELSIF v_current_role = 'supervisor' THEN
        -- Supervisor creates Leader, Member
        IF p_role IN ('admin', 'supervisor') THEN
            RAISE EXCEPTION 'Supervisors cannot create Admins or other Supervisors';
        END IF;
    ELSIF v_current_role = 'leader' THEN
        -- Leader creates Member only
        IF p_role <> 'member' THEN
            RAISE EXCEPTION 'Leaders can only create Members';
        END IF;
    ELSE
        RAISE EXCEPTION 'Permission denied';
    END IF;

    -- Logic: If member_id provided, use it. Else create new (to keep legacy compat if needed, or we can enforce).
    IF p_member_id IS NOT NULL THEN
        v_final_member_id := p_member_id;
        
        -- Verify member belongs to same church
        PERFORM 1 FROM members WHERE id = p_member_id AND church_id = v_church_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Member not found or does not belong to your church';
        END IF;
    ELSE
        -- Fallback: Create new member (Old behavior)
        INSERT INTO members (church_id, name, email, phone, status, church_role)
        VALUES (v_church_id, p_name, p_email, p_phone, 'Active', 'Member')
        RETURNING id INTO v_final_member_id;
    END IF;

    -- Insert User
    INSERT INTO users (id, church_id, member_id, email, role)
    VALUES (p_user_id, v_church_id, v_final_member_id, p_email, p_role)
    ON CONFLICT (id) DO UPDATE 
    SET role = EXCLUDED.role,
        member_id = v_final_member_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
