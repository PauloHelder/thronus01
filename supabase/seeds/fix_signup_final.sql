-- =====================================================
-- SOLUÇÃO DEFINITIVA DE CADASTRO
-- 1. Limpa o usuário travado
-- 2. Ajusta permissões para permitir cadastro sem confirmação prévia
-- =====================================================

-- 1. LIMPEZA DO USUÁRIO TRAVADO
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

-- 2. CORREÇÃO DE PERMISSÕES (RLS)
-- Permite que o fluxo de cadastro funcione mesmo sem sessão confirmada

-- Habilitar RLS
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Limpar políticas antigas de INSERT
DROP POLICY IF EXISTS "Authenticated users can create church" ON churches;
DROP POLICY IF EXISTS "Anyone can create church" ON churches;
DROP POLICY IF EXISTS "Authenticated users can create members" ON members;
DROP POLICY IF EXISTS "Anyone can create members" ON members;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Anyone can insert profile" ON users;

-- Criar políticas permissivas para CADASTRO (INSERT)
-- Permitir criação pública de igrejas (necessário para o primeiro passo)
CREATE POLICY "Anyone can create church" ON churches
    FOR INSERT WITH CHECK (true);

-- Permitir criação pública de membros (necessário para o pastor)
CREATE POLICY "Anyone can create members" ON members
    FOR INSERT WITH CHECK (true);

-- Permitir criação pública de vínculo de usuário
CREATE POLICY "Anyone can insert profile" ON users
    FOR INSERT WITH CHECK (true);

-- Manter políticas de LEITURA restritas (segurança)
DROP POLICY IF EXISTS "Users can view own church" ON churches;
CREATE POLICY "Users can view own church" ON churches
    FOR SELECT USING (
        id IN (SELECT church_id FROM users WHERE id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can view members of own church" ON members;
CREATE POLICY "Users can view members of own church" ON members
    FOR SELECT USING (
        church_id IN (SELECT church_id FROM users WHERE id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);
