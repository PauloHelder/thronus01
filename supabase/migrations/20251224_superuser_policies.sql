-- =====================================================
-- SUPERUSER POLICIES
-- Allow Superusers (role 'superuser' or permissions->roles includes 'superuser')
-- to access all data across tenants
-- =====================================================

-- 1. CHURCHES
CREATE POLICY "Superusers can view all churches"
ON churches FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (
      role = 'superuser' 
      OR 
      (permissions->'roles' ? 'superuser')
    )
  )
);

CREATE POLICY "Superusers can update all churches"
ON churches FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (
      role = 'superuser' 
      OR 
      (permissions->'roles' ? 'superuser')
    )
  )
);

CREATE POLICY "Superusers can delete churches"
ON churches FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (
      role = 'superuser' 
      OR 
      (permissions->'roles' ? 'superuser')
    )
  )
);

-- 2. SUBSCRIPTIONS
CREATE POLICY "Superusers can view all subscriptions"
ON subscriptions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (
      role = 'superuser' 
      OR 
      (permissions->'roles' ? 'superuser')
    )
  )
);

CREATE POLICY "Superusers can manage all subscriptions"
ON subscriptions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (
      role = 'superuser' 
      OR 
      (permissions->'roles' ? 'superuser')
    )
  )
);

-- 3. USERS
CREATE POLICY "Superusers can view all users"
ON users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (
      role = 'superuser' 
      OR 
      (permissions->'roles' ? 'superuser')
    )
  )
);
