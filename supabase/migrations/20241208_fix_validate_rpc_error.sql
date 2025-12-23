-- Drop the function first to ensure no return type collisions during replacement
DROP FUNCTION IF EXISTS validate_invite_token(uuid);

-- Recreate the function with explicit type casting to avoid structure mismatch errors
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
        TRUE::BOOLEAN as is_valid,
        c.name::TEXT as church_name,
        ui.email::TEXT as invite_email,
        ui.role::TEXT as invite_role
    FROM user_invites ui
    JOIN churches c ON c.id = ui.church_id
    WHERE ui.token = p_token
    AND ui.status = 'pending'
    AND ui.expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION validate_invite_token TO anon, authenticated, service_role;
