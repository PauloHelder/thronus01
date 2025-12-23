-- Update is_admin function to include 'superuser' role
-- This ensures that superusers have admin privileges across the system where is_admin() is used.

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role IN ('admin', 'superuser')
        FROM users
        WHERE id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
