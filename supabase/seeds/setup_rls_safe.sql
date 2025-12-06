-- =====================================================
-- CONFIGURAÇÃO DE RLS APENAS PARA TABELAS EXISTENTES
-- Este script verifica se a tabela existe antes de criar políticas
-- =====================================================

-- ============ MEMBERS (Membros) ============
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'members') THEN
        ALTER TABLE members ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view own church members" ON members;
        DROP POLICY IF EXISTS "Users can insert own church members" ON members;
        DROP POLICY IF EXISTS "Users can update own church members" ON members;
        DROP POLICY IF EXISTS "Users can delete own church members" ON members;

        CREATE POLICY "Users can view own church members" ON members
            FOR SELECT USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

        CREATE POLICY "Users can insert own church members" ON members
            FOR INSERT WITH CHECK (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

        CREATE POLICY "Users can update own church members" ON members
            FOR UPDATE USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

        CREATE POLICY "Users can delete own church members" ON members
            FOR DELETE USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));
            
        RAISE NOTICE 'RLS configurado para: members';
    ELSE
        RAISE NOTICE 'Tabela members não existe - pulando';
    END IF;
END $$;

-- ============ SERVICES (Cultos) ============
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'services') THEN
        ALTER TABLE services ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can view own church services" ON services;
        DROP POLICY IF EXISTS "Users can insert own church services" ON services;
        DROP POLICY IF EXISTS "Users can update own church services" ON services;
        DROP POLICY IF EXISTS "Users can delete own church services" ON services;

        CREATE POLICY "Users can view own church services" ON services
            FOR SELECT USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

        CREATE POLICY "Users can insert own church services" ON services
            FOR INSERT WITH CHECK (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

        CREATE POLICY "Users can update own church services" ON services
            FOR UPDATE USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

        CREATE POLICY "Users can delete own church services" ON services
            FOR DELETE USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));
            
        RAISE NOTICE 'RLS configurado para: services';
    ELSE
        RAISE NOTICE 'Tabela services não existe - pulando';
    END IF;
END $$;

-- ============ EVENTS (Eventos) ============
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'events') THEN
        ALTER TABLE events ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can view own church events" ON events;
        DROP POLICY IF EXISTS "Users can insert own church events" ON events;
        DROP POLICY IF EXISTS "Users can update own church events" ON events;
        DROP POLICY IF EXISTS "Users can delete own church events" ON events;

        CREATE POLICY "Users can view own church events" ON events
            FOR SELECT USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

        CREATE POLICY "Users can insert own church events" ON events
            FOR INSERT WITH CHECK (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

        CREATE POLICY "Users can update own church events" ON events
            FOR UPDATE USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

        CREATE POLICY "Users can delete own church events" ON events
            FOR DELETE USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));
            
        RAISE NOTICE 'RLS configurado para: events';
    ELSE
        RAISE NOTICE 'Tabela events não existe - pulando';
    END IF;
END $$;

-- ============ GROUPS (Grupos/Células) ============
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'groups') THEN
        ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can view own church groups" ON groups;
        DROP POLICY IF EXISTS "Users can insert own church groups" ON groups;
        DROP POLICY IF EXISTS "Users can update own church groups" ON groups;
        DROP POLICY IF EXISTS "Users can delete own church groups" ON groups;

        CREATE POLICY "Users can view own church groups" ON groups
            FOR SELECT USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

        CREATE POLICY "Users can insert own church groups" ON groups
            FOR INSERT WITH CHECK (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

        CREATE POLICY "Users can update own church groups" ON groups
            FOR UPDATE USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

        CREATE POLICY "Users can delete own church groups" ON groups
            FOR DELETE USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));
            
        RAISE NOTICE 'RLS configurado para: groups';
    ELSE
        RAISE NOTICE 'Tabela groups não existe - pulando';
    END IF;
END $$;

-- ============ DEPARTMENTS (Departamentos) ============
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'departments') THEN
        ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view own church departments" ON departments;
        DROP POLICY IF EXISTS "Users can insert own church departments" ON departments;
        DROP POLICY IF EXISTS "Users can update own church departments" ON departments;
        DROP POLICY IF EXISTS "Users can delete own church departments" ON departments;

        CREATE POLICY "Users can view own church departments" ON departments
            FOR SELECT USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

        CREATE POLICY "Users can insert own church departments" ON departments
            FOR INSERT WITH CHECK (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

        CREATE POLICY "Users can update own church departments" ON departments
            FOR UPDATE USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

        CREATE POLICY "Users can delete own church departments" ON departments
            FOR DELETE USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));
            
        RAISE NOTICE 'RLS configurado para: departments';
    ELSE
        RAISE NOTICE 'Tabela departments não existe - pulando';
    END IF;
END $$;

-- ============ TRANSACTIONS (Transações Financeiras) ============
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
        ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can view own church transactions" ON transactions;
        DROP POLICY IF EXISTS "Users can insert own church transactions" ON transactions;
        DROP POLICY IF EXISTS "Users can update own church transactions" ON transactions;
        DROP POLICY IF EXISTS "Users can delete own church transactions" ON transactions;

        CREATE POLICY "Users can view own church transactions" ON transactions
            FOR SELECT USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

        CREATE POLICY "Users can insert own church transactions" ON transactions
            FOR INSERT WITH CHECK (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

        CREATE POLICY "Users can update own church transactions" ON transactions
            FOR UPDATE USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

        CREATE POLICY "Users can delete own church transactions" ON transactions
            FOR DELETE USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));
            
        RAISE NOTICE 'RLS configurado para: transactions';
    ELSE
        RAISE NOTICE 'Tabela transactions não existe - pulando';
    END IF;
END $$;

-- ============ TEACHINGS (Ensinos) ============
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'teachings') THEN
        ALTER TABLE teachings ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can view own church teachings" ON teachings;
        DROP POLICY IF EXISTS "Users can insert own church teachings" ON teachings;
        DROP POLICY IF EXISTS "Users can update own church teachings" ON teachings;
        DROP POLICY IF EXISTS "Users can delete own church teachings" ON teachings;

        CREATE POLICY "Users can view own church teachings" ON teachings
            FOR SELECT USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

        CREATE POLICY "Users can insert own church teachings" ON teachings
            FOR INSERT WITH CHECK (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

        CREATE POLICY "Users can update own church teachings" ON teachings
            FOR UPDATE USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

        CREATE POLICY "Users can delete own church teachings" ON teachings
            FOR DELETE USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));
            
        RAISE NOTICE 'RLS configurado para: teachings';
    ELSE
        RAISE NOTICE 'Tabela teachings não existe - pulando';
    END IF;
END $$;

-- ============ DISCIPLESHIPS (Discipulados) ============
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'discipleships') THEN
        ALTER TABLE discipleships ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can view own church discipleships" ON discipleships;
        DROP POLICY IF EXISTS "Users can insert own church discipleships" ON discipleships;
        DROP POLICY IF EXISTS "Users can update own church discipleships" ON discipleships;
        DROP POLICY IF EXISTS "Users can delete own church discipleships" ON discipleships;

        CREATE POLICY "Users can view own church discipleships" ON discipleships
            FOR SELECT USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

        CREATE POLICY "Users can insert own church discipleships" ON discipleships
            FOR INSERT WITH CHECK (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

        CREATE POLICY "Users can update own church discipleships" ON discipleships
            FOR UPDATE USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

        CREATE POLICY "Users can delete own church discipleships" ON discipleships
            FOR DELETE USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));
            
        RAISE NOTICE 'RLS configurado para: discipleships';
    ELSE
        RAISE NOTICE 'Tabela discipleships não existe - pulando';
    END IF;
END $$;

-- ============ TABELAS AUXILIARES ============

-- TRANSACTION_CATEGORIES
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transaction_categories') THEN
        DROP POLICY IF EXISTS "Users can view own church categories" ON transaction_categories;
        CREATE POLICY "Users can view own church categories" ON transaction_categories
            FOR SELECT USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));
        RAISE NOTICE 'RLS configurado para: transaction_categories';
    ELSE
        RAISE NOTICE 'Tabela transaction_categories não existe - pulando';
    END IF;
END $$;

-- CHRISTIAN_STAGES
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'christian_stages') THEN
        DROP POLICY IF EXISTS "Users can view own church stages" ON christian_stages;
        CREATE POLICY "Users can view own church stages" ON christian_stages
            FOR SELECT USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));
        RAISE NOTICE 'RLS configurado para: christian_stages';
    ELSE
        RAISE NOTICE 'Tabela christian_stages não existe - pulando';
    END IF;
END $$;

-- TEACHING_CATEGORIES
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'teaching_categories') THEN
        DROP POLICY IF EXISTS "Users can view own church teaching_categories" ON teaching_categories;
        CREATE POLICY "Users can view own church teaching_categories" ON teaching_categories
            FOR SELECT USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));
        RAISE NOTICE 'RLS configurado para: teaching_categories';
    ELSE
        RAISE NOTICE 'Tabela teaching_categories não existe - pulando';
    END IF;
END $$;

-- =====================================================
-- RESUMO FINAL
-- =====================================================
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Configuração de RLS concluída!';
    RAISE NOTICE 'Total de políticas criadas: %', table_count;
    RAISE NOTICE '========================================';
END $$;

-- Listar todas as políticas criadas
SELECT 
    tablename as "Tabela", 
    COUNT(*) as "Políticas"
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
