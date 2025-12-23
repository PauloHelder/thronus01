-- Allow Admins to delete ANY invite, and Users (Leaders) to delete THEIR OWN invites.
DROP POLICY IF EXISTS "Admins can delete invites" ON user_invites;

CREATE POLICY "Admins and Owners can delete invites"
    ON user_invites FOR DELETE
    USING (
        church_id = (SELECT church_id FROM users WHERE id = auth.uid())
        AND (
            (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'superuser')
            OR
            created_by = auth.uid()
        )
    );
