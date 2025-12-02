-- =====================================================
-- THRONUS V5 - COMPLETE SETUP SCRIPT
-- Execute this file to set up the entire database
-- =====================================================
-- 
-- IMPORTANT: This script combines all migrations and seeds
-- Use this ONLY for initial setup or complete reset
-- 
-- For production, use individual migration files
-- =====================================================

-- =====================================================
-- STEP 1: INITIAL SCHEMA
-- =====================================================

\echo 'Creating initial schema...'
\i migrations/20241202_001_initial_schema.sql

-- =====================================================
-- STEP 2: RLS POLICIES
-- =====================================================

\echo 'Setting up Row Level Security policies...'
\i migrations/20241202_002_rls_policies.sql

-- =====================================================
-- STEP 3: SEED DATA (Optional - Comment out for production)
-- =====================================================

\echo 'Inserting seed data...'
\i seeds/seed.sql

-- =====================================================
-- VERIFICATION
-- =====================================================

\echo 'Verifying setup...'

-- Count tables
SELECT 
    schemaname,
    COUNT(*) as table_count
FROM pg_tables 
WHERE schemaname = 'public'
GROUP BY schemaname;

-- Check RLS status
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Count seed data
SELECT 'Churches' as entity, COUNT(*) as count FROM churches
UNION ALL
SELECT 'Plans', COUNT(*) FROM plans
UNION ALL
SELECT 'Members', COUNT(*) FROM members
UNION ALL
SELECT 'Groups', COUNT(*) FROM groups
UNION ALL
SELECT 'Departments', COUNT(*) FROM departments
UNION ALL
SELECT 'Services', COUNT(*) FROM services
UNION ALL
SELECT 'Events', COUNT(*) FROM events
UNION ALL
SELECT 'Transactions', COUNT(*) FROM transactions;

\echo 'Setup complete!'
