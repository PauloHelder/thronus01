-- Updating validation function to include member name if it exists
CREATE OR REPLACE FUNCTION validate_invite_token_v2(p_token UUID)
RETURNS TABLE (
    is_valid BOOLEAN,
    church_name TEXT,
    invite_email TEXT,
    invite_role TEXT,
    member_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        true::BOOLEAN as is_valid,
        c.name::TEXT as church_name,
        ui.email::TEXT as invite_email,
        ui.role::TEXT as invite_role,
        m.name::TEXT as member_name
    FROM user_invites ui
    JOIN churches c ON c.id = ui.church_id
    LEFT JOIN members m ON m.church_id = ui.church_id AND m.email = ui.email
    WHERE ui.token = p_token
    AND ui.status = 'pending'
    AND ui.expires_at > NOW()
    LIMIT 1; -- Ensure single row
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
