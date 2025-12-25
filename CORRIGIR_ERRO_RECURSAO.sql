-- =================================================================================
-- CORREÇÃO DE ERRO DE RECURSÃO INFINITA (LOOP)
-- =================================================================================
-- O erro que você está vendo ("Error fetching data") acontece porque a regra anterior
-- criou um "loop infinito" (a tabela users perguntava para ela mesma se podia ser lida,
-- criando um ciclo sem fim).
--
-- ESTA SOLUÇÃO CORRIGE ISSO USANDO UMA FUNÇÃO DE SEGURANÇA (SECURITY DEFINER).
-- =================================================================================

-- 1. Criar função segura para verificar superusuário (bypassing RLS)
CREATE OR REPLACE FUNCTION is_superuser()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT 
            COALESCE(role = 'superuser' OR role = 'admin', FALSE)
            OR 
            (permissions->'roles' ? 'superuser')
        FROM users
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Remover políticas antigas (que causavam erro) e aplicar as novas

-- === CHURCHES ===
DROP POLICY IF EXISTS "Superusers can view all churches" ON churches;
DROP POLICY IF EXISTS "Superusers can update all churches" ON churches;
DROP POLICY IF EXISTS "Superusers can delete churches" ON churches;

CREATE POLICY "Superusers can view all churches"
ON churches FOR SELECT
USING ( is_superuser() );

CREATE POLICY "Superusers can update all churches"
ON churches FOR UPDATE
USING ( is_superuser() );

CREATE POLICY "Superusers can delete churches"
ON churches FOR DELETE
USING ( is_superuser() );

-- === SUBSCRIPTIONS ===
DROP POLICY IF EXISTS "Superusers can view all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Superusers can manage all subscriptions" ON subscriptions;

CREATE POLICY "Superusers can view all subscriptions"
ON subscriptions FOR SELECT
USING ( is_superuser() );

CREATE POLICY "Superusers can manage all subscriptions"
ON subscriptions FOR ALL
USING ( is_superuser() );

-- === USERS ===
DROP POLICY IF EXISTS "Superusers can view all users" ON users;

CREATE POLICY "Superusers can view all users"
ON users FOR SELECT
USING ( is_superuser() );

-- === PLANS (Garantir acesso total) ===
DROP POLICY IF EXISTS "Superusers can manage plans" ON plans;
CREATE POLICY "Superusers can manage plans"
ON plans FOR ALL
USING ( is_superuser() );
