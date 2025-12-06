-- =====================================================
-- DISABLE RLS TEMPORARILY FOR TESTING
-- ATENÇÃO: Isso remove a segurança! Use apenas para teste!
-- =====================================================

-- Disable RLS on services table
ALTER TABLE services DISABLE ROW LEVEL SECURITY;

-- Disable RLS on service_types table  
ALTER TABLE service_types DISABLE ROW LEVEL SECURITY;

-- NOTA: Após testar, você deve RE-HABILITAR o RLS executando:
-- ALTER TABLE services ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;
