-- =================================================================================
-- SCRIPT PARA CORRIGIR VISIBILIDADE DO SUPER ADMIN
-- =================================================================================
-- Instruções:
-- 1. Copie todo o conteúdo deste arquivo.
-- 2. Vá para o painel do Supabase (Dashboard).
-- 3. Abra o "SQL Editor" (ícone de terminal na barra lateral esquerda).
-- 4. Cole o código e clique em "Run".
-- =================================================================================

-- 1. Habilitar Superusuários a verem TODAS as igrejas
CREATE POLICY "Superusers can view all churches"
ON churches FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (
      role = 'superuser' 
      OR 
      (permissions->'roles' ? 'superuser')
      OR
      role = 'admin' -- Fallback temporário para testes se o role superuser não estiver setado
    )
  )
);

-- 2. Habilitar Superusuários a verem TODAS as inscrições (faturamento)
CREATE POLICY "Superusers can view all subscriptions"
ON subscriptions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (
      role = 'superuser' 
      OR 
      (permissions->'roles' ? 'superuser')
      OR
      role = 'admin'
    )
  )
);

-- 3. Habilitar Superusuários a verem TODOS os usuários
CREATE POLICY "Superusers can view all users"
ON users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (
      role = 'superuser' 
      OR 
      (permissions->'roles' ? 'superuser')
      OR
      role = 'admin'
    )
  )
);

-- 4. Opcional: Atualizar e Deletar
CREATE POLICY "Superusers can update all churches"
ON churches FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (role = 'superuser' OR (permissions->'roles' ? 'superuser'))
  )
);

CREATE POLICY "Superusers can delete churches"
ON churches FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (role = 'superuser' OR (permissions->'roles' ? 'superuser'))
  )
);
