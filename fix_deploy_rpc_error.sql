-- Remove restrictive role checks to allow custom roles and 'supervisor'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE user_invites DROP CONSTRAINT IF EXISTS user_invites_role_check;

-- Add 'supervisor' to allowed roles if we want a check, but better to allow any string
-- We can add a check that it's not null/empty
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (length(role) > 0);

-- RPC to manually create the user entry (after auth.signUp)
CREATE OR REPLACE FUNCTION admin_create_user_entry(
    p_user_id UUID,
    p_email TEXT,
    p_role TEXT,
    p_name TEXT,
    p_phone TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_church_id UUID;
    v_current_role TEXT;
    v_new_member_id UUID;
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

    -- Insert Member (or return existing if somehow already exists?)
    -- Assuming new member for new user.
    INSERT INTO members (church_id, name, email, phone, status, church_role)
    VALUES (v_church_id, p_name, p_email, p_phone, 'Active', 'Member')
    RETURNING id INTO v_new_member_id;

    -- Insert User with Upsert (robustness against triggers or races)
    INSERT INTO users (id, church_id, member_id, email, role)
    VALUES (p_user_id, v_church_id, v_new_member_id, p_email, p_role)
    ON CONFLICT (id) DO UPDATE 
    SET role = EXCLUDED.role,
        member_id = v_new_member_id; -- Ensure member link is correct

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_create_user_entry TO authenticated;
