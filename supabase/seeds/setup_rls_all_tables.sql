-- =====================================================
-- CONFIGURAÇÃO COMPLETA DE RLS (Row Level Security)
-- Para todas as tabelas de dados da aplicação
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- ============ SERVICES (Cultos) ============
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

-- ============ EVENTS (Eventos) ============
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

-- ============ GROUPS (Grupos/Células) ============
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

-- ============ DEPARTMENTS (Departamentos) ============
-- Já tem políticas, mas vamos garantir que estão completas
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

-- ============ TRANSACTIONS (Transações Financeiras) ============
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

-- ============ TEACHINGS (Ensinos) ============
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

-- ============ DISCIPLESHIPS (Discipulados) ============
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

-- ============ MEMBERS (Membros) - Garantir que está completo ============
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

-- ============ TABELAS AUXILIARES ============

-- TRANSACTION_CATEGORIES
DROP POLICY IF EXISTS "Users can view own church categories" ON transaction_categories;
CREATE POLICY "Users can view own church categories" ON transaction_categories
    FOR SELECT USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

-- CHRISTIAN_STAGES
DROP POLICY IF EXISTS "Users can view own church stages" ON christian_stages;
CREATE POLICY "Users can view own church stages" ON christian_stages
    FOR SELECT USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

-- TEACHING_CATEGORIES
DROP POLICY IF EXISTS "Users can view own church teaching_categories" ON teaching_categories;
CREATE POLICY "Users can view own church teaching_categories" ON teaching_categories
    FOR SELECT USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

-- =====================================================
-- FIM DA CONFIGURAÇÃO
-- =====================================================

-- Verificar se as políticas foram criadas
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
