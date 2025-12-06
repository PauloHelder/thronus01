-- =====================================================
-- CONFIGURE RLS POLICIES FOR SERVICE_TYPES
-- Configura permissões de acesso à tabela service_types
-- =====================================================

-- Enable RLS on service_types table
ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view service types from their church" ON service_types;
DROP POLICY IF EXISTS "Users can insert service types for their church" ON service_types;
DROP POLICY IF EXISTS "Users can update service types from their church" ON service_types;
DROP POLICY IF EXISTS "Users can delete service types from their church" ON service_types;

-- Policy: Users can view service types from their church
CREATE POLICY "Users can view service types from their church"
ON service_types
FOR SELECT
USING (
    church_id IN (
        SELECT church_id FROM users WHERE id = auth.uid()
    )
);

-- Policy: Users can insert service types for their church
CREATE POLICY "Users can insert service types for their church"
ON service_types
FOR INSERT
WITH CHECK (
    church_id IN (
        SELECT church_id FROM users WHERE id = auth.uid()
    )
);

-- Policy: Users can update service types from their church
CREATE POLICY "Users can update service types from their church"
ON service_types
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

-- Policy: Users can delete (soft delete) service types from their church
CREATE POLICY "Users can delete service types from their church"
ON service_types
FOR UPDATE
USING (
    church_id IN (
        SELECT church_id FROM users WHERE id = auth.uid()
    )
    AND is_default = false  -- Only allow deleting non-default types
);
