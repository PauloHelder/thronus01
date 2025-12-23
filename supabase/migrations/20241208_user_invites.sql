-- Create User Invites Table
CREATE TABLE IF NOT EXISTS user_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'leader', 'member')),
    token UUID DEFAULT uuid_generate_v4(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- Enable RLS
ALTER TABLE user_invites ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view invites from their church"
    ON user_invites FOR SELECT
    USING (church_id = (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins and Leaders can create invites"
    ON user_invites FOR INSERT
    WITH CHECK (
        church_id = (SELECT church_id FROM users WHERE id = auth.uid())
        AND (
            (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'leader')
        )
    );

CREATE POLICY "Admins can delete invites"
    ON user_invites FOR DELETE
    USING (
        church_id = (SELECT church_id FROM users WHERE id = auth.uid())
        AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
    );

-- RPC to create invite securely
CREATE OR REPLACE FUNCTION create_user_invite(
    p_email TEXT,
    p_role TEXT
) RETURNS UUID AS $$
DECLARE
    v_church_id UUID;
    v_invite_id UUID;
BEGIN
    -- Get current user's church
    SELECT church_id INTO v_church_id FROM users WHERE id = auth.uid();
    IF v_church_id IS NULL THEN RAISE EXCEPTION 'User not in a church'; END IF;

    -- Check permissions
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'leader')) THEN
        RAISE EXCEPTION 'Permission denied';
    END IF;

    -- Create Invite
    INSERT INTO user_invites (church_id, email, role, created_by)
    VALUES (v_church_id, p_email, p_role, auth.uid())
    RETURNING id INTO v_invite_id;

    RETURN v_invite_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_user_invite TO authenticated;

-- Function to validate invite token (Public access)
CREATE OR REPLACE FUNCTION validate_invite_token(p_token UUID)
RETURNS TABLE (
    is_valid BOOLEAN,
    church_name TEXT,
    invite_email TEXT,
    invite_role TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        true as is_valid,
        c.name as church_name,
        ui.email as invite_email,
        ui.role as invite_role
    FROM user_invites ui
    JOIN churches c ON c.id = ui.church_id
    WHERE ui.token = p_token
    AND ui.status = 'pending'
    AND ui.expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION validate_invite_token TO anon, authenticated, service_role;

-- Function to accept invite (Used during signup)
CREATE OR REPLACE FUNCTION accept_invite(
    p_token UUID,
    p_user_id UUID,
    p_full_name TEXT,
    p_phone TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_invite RECORD;
BEGIN
    -- Get Invite
    SELECT * INTO v_invite FROM user_invites 
    WHERE token = p_token AND status = 'pending' AND expires_at > NOW();

    IF v_invite IS NULL THEN
        RAISE EXCEPTION 'Invalid or expired invite';
    END IF;

    -- Create Member (if not exists, or link?)
    -- For simplicity, we create a new member or update if email matches?
    -- No, let's create a new member entry for this user
    
    WITH new_member AS (
        INSERT INTO members (church_id, name, email, phone, status, church_role)
        VALUES (v_invite.church_id, p_full_name, v_invite.email, p_phone, 'Active', 'Member')
        RETURNING id
    )
    INSERT INTO users (id, church_id, member_id, email, role)
    SELECT p_user_id, v_invite.church_id, new_member.id, v_invite.email, v_invite.role
    FROM new_member;

    -- Update Invite Status
    UPDATE user_invites SET status = 'accepted' WHERE id = v_invite.id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION accept_invite TO authenticated, service_role; -- Note: user must be authenticated (signed up) to call this? 
-- Actually, the flow is: 
-- 1. SignUp (creates auth user)
-- 2. Call accept_invite (links auth user to church)
