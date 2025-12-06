-- =====================================================
-- CORREÇÃO FINAL DE CADASTRO (PERMISSÕES PÚBLICAS)
-- Este script garante que o cadastro funcione sem sessão ativa
-- =====================================================

-- 1. Limpar usuário travado (se houver)
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'mvidaegraca21@gmail.com';
    
    DELETE FROM users WHERE email = 'mvidaegraca21@gmail.com';
    DELETE FROM members WHERE email = 'mvidaegraca21@gmail.com';
    DELETE FROM churches WHERE email = 'mvidaegraca21@gmail.com';
    
    IF v_user_id IS NOT NULL THEN
        DELETE FROM auth.identities WHERE user_id = v_user_id;
        DELETE FROM auth.users WHERE id = v_user_id;
    END IF;
END $$;

-- 2. Habilitar RLS nas tabelas (se não estiver)
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE christian_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_categories ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas antigas de INSERT (para evitar conflitos)
DROP POLICY IF EXISTS "Anyone can create church" ON churches;
DROP POLICY IF EXISTS "Authenticated users can create church" ON churches;
DROP POLICY IF EXISTS "Anyone can create members" ON members;
DROP POLICY IF EXISTS "Authenticated users can create members" ON members;
DROP POLICY IF EXISTS "Anyone can insert profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Anyone can create departments" ON departments;
DROP POLICY IF EXISTS "Anyone can create categories" ON transaction_categories;
DROP POLICY IF EXISTS "Anyone can create stages" ON christian_stages;
DROP POLICY IF EXISTS "Anyone can create teaching" ON teaching_categories;

-- 4. Criar políticas de INSERT PÚBLICAS (Permite cadastro sem login)
-- Isso é necessário porque o usuário ainda não confirmou o email, então não tem sessão válida.

CREATE POLICY "Anyone can create church" ON churches FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can create members" ON members FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert profile" ON users FOR INSERT WITH CHECK (true);

-- Permitir criação de dados padrão
CREATE POLICY "Anyone can create departments" ON departments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can create categories" ON transaction_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can create stages" ON christian_stages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can create teaching" ON teaching_categories FOR INSERT WITH CHECK (true);

-- 5. Manter políticas de SELECT restritas (Segurança)
-- Só permite ver dados se pertencer à mesma igreja ou for o próprio usuário

DROP POLICY IF EXISTS "Users can view own church" ON churches;
CREATE POLICY "Users can view own church" ON churches FOR SELECT USING (
    id IN (SELECT church_id FROM users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can view members of own church" ON members;
CREATE POLICY "Users can view members of own church" ON members FOR SELECT USING (
    church_id IN (SELECT church_id FROM users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);

-- 6. Políticas para dados auxiliares (SELECT)
DROP POLICY IF EXISTS "Users can view departments" ON departments;
CREATE POLICY "Users can view departments" ON departments FOR SELECT USING (
    church_id IN (SELECT church_id FROM users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can view categories" ON transaction_categories;
CREATE POLICY "Users can view categories" ON transaction_categories FOR SELECT USING (
    church_id IN (SELECT church_id FROM users WHERE id = auth.uid())
);
