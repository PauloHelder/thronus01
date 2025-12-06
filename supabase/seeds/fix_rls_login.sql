-- =====================================================
-- CORREÇÃO DE PERMISSÕES RLS (Row Level Security)
-- Execute este script no Supabase SQL Editor para corrigir problemas de login
-- =====================================================

-- 1. Habilitar RLS nas tabelas críticas (se não estiver)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- 2. Limpar políticas antigas para evitar conflitos (opcional, mas recomendado se houver bagunça)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON churches;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON churches;

-- 3. Políticas para a tabela USERS
-- Permitir que o usuário veja seu próprio registro
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Permitir que o usuário atualize seu próprio registro
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Permitir inserção durante o cadastro (CRÍTICO)
-- Esta política permite que qualquer usuário autenticado insira um registro
-- desde que o ID do registro corresponda ao seu próprio ID de autenticação.
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Políticas para a tabela CHURCHES
-- Permitir que usuários vejam a igreja à qual pertencem
CREATE POLICY "Users can view own church" ON churches
    FOR SELECT USING (
        id IN (SELECT church_id FROM users WHERE id = auth.uid())
    );

-- Permitir criação de igrejas (necessário para o cadastro)
-- Permitimos que qualquer usuário autenticado crie uma igreja
CREATE POLICY "Authenticated users can create church" ON churches
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 5. Políticas para a tabela MEMBERS
-- Permitir ver membros da mesma igreja
CREATE POLICY "Users can view members of own church" ON members
    FOR SELECT USING (
        church_id IN (SELECT church_id FROM users WHERE id = auth.uid())
    );

-- Permitir criar membros (necessário para o cadastro do pastor)
CREATE POLICY "Authenticated users can create members" ON members
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- DIAGNÓSTICO DE USUÁRIO ESPECÍFICO
-- Substitua o email abaixo para verificar um usuário
-- =====================================================

-- SELECT * FROM auth.users WHERE email = 'seu_email@exemplo.com';
-- SELECT * FROM users WHERE email = 'seu_email@exemplo.com';
