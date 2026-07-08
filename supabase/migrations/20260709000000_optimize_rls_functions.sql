-- =====================================================
-- RLS FUNCTIONS OPTIMIZATION FOR PERFORMANCE & MEMORY
-- =====================================================

-- 1. Optimize get_user_church_id by marking it as STABLE
CREATE OR REPLACE FUNCTION get_user_church_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT church_id 
        FROM public.users 
        WHERE id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Optimize is_admin by marking it as STABLE
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = 'admin'
        FROM public.users
        WHERE id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Optimize user_has_permission by marking it as STABLE
CREATE OR REPLACE FUNCTION user_has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT 
            CASE 
                WHEN role = 'admin' THEN true
                WHEN permissions ? permission_name THEN (permissions->permission_name)::boolean
                ELSE false
            END
        FROM public.users
        WHERE id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4. Create a stable helper to get current member ID (optimizes counseling & signer checks)
CREATE OR REPLACE FUNCTION get_user_member_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id 
        FROM public.members 
        WHERE email = auth.jwt()->>'email'
          AND deleted_at IS NULL
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5. Update pastoral_counselings policies to use get_user_member_id()
DROP POLICY IF EXISTS "View pastoral counselings" ON public.pastoral_counselings;
CREATE POLICY "View pastoral counselings"
    ON public.pastoral_counselings FOR SELECT
    USING (
        church_id = get_user_church_id()
        AND (
            is_admin()
            OR
            pastor_id = get_user_member_id()
        )
    );

DROP POLICY IF EXISTS "Update pastoral counselings" ON public.pastoral_counselings;
CREATE POLICY "Update pastoral counselings"
    ON public.pastoral_counselings FOR UPDATE
    USING (
        church_id = get_user_church_id()
        AND (
            is_admin()
            OR
            pastor_id = get_user_member_id()
        )
    );

DROP POLICY IF EXISTS "Delete pastoral counselings" ON public.pastoral_counselings;
CREATE POLICY "Delete pastoral counselings"
    ON public.pastoral_counselings FOR DELETE
    USING (
        church_id = get_user_church_id()
        AND (
            is_admin()
            OR
            pastor_id = get_user_member_id()
        )
    );
