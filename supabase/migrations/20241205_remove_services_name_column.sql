-- =====================================================
-- FIX SERVICES TABLE - Remove old columns
-- As colunas 'name' e 'type' não são mais necessárias
-- Agora usamos service_type_id
-- =====================================================

-- Remove old columns
ALTER TABLE services DROP COLUMN IF EXISTS name;
ALTER TABLE services DROP COLUMN IF EXISTS type;

-- Verify the change
-- SELECT column_name, is_nullable, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'services';
