-- =====================================================
-- CONFIGURE RLS POLICIES FOR SERVICES
-- Configura permissões de acesso à tabela services
-- =====================================================

-- Enable RLS on services table
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view services from their church" ON services;
DROP POLICY IF EXISTS "Users can insert services for their church" ON services;
DROP POLICY IF EXISTS "Users can update services from their church" ON services;
DROP POLICY IF EXISTS "Users can delete services from their church" ON services;

-- Policy: Users can view services from their church
CREATE POLICY "Users can view services from their church"
ON services
FOR SELECT
USING (
    church_id IN (
        SELECT church_id FROM users WHERE id = auth.uid()
    )
);

-- Policy: Users can insert services for their church
CREATE POLICY "Users can insert services for their church"
ON services
FOR INSERT
WITH CHECK (
    church_id IN (
        SELECT church_id FROM users WHERE id = auth.uid()
    )
);

-- Policy: Users can update services from their church
CREATE POLICY "Users can update services from their church"
ON services
FOR UPDATE
USING (
    church_id IN (
        SELECT church_id FROM users WHERE id = auth.uid()
    )
)
WITH CHECK (
    church_id IN (
        SELECT church_id FROM users WHERE id = auth.uid()
    )
);

-- Policy: Users can delete (soft delete) services from their church
CREATE POLICY "Users can delete services from their church"
ON services
FOR UPDATE
USING (
    church_id IN (
        SELECT church_id FROM users WHERE id = auth.uid()
    )
);
