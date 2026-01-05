-- Corrigir Permissões de Acesso às Configurações da Igreja

-- 1. Habilita RLS na tabela churches por segurança
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;

-- 2. Permite que QUALQUER usuário autenticado e vinculado à igreja possa VER as configurações
-- Isso resolve o erro de "Loading settings" no console
DROP POLICY IF EXISTS "Users can view their own church" ON public.churches;
CREATE POLICY "Users can view their own church"
ON public.churches FOR SELECT
TO authenticated
USING (
  id = (SELECT church_id FROM public.users WHERE id = auth.uid() LIMIT 1)
);

-- 3. Permite que APENAS Administradores (e Supervisores) possam ATUALIZAR as configurações
DROP POLICY IF EXISTS "Admins can update their own church" ON public.churches;
CREATE POLICY "Admins can update their own church"
ON public.churches FOR UPDATE
TO authenticated
USING (
  id = (SELECT church_id FROM public.users WHERE id = auth.uid() LIMIT 1)
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    -- Adicionando 'supervisor' para garantir acesso caso a regra de negócio expanda
    AND role IN ('admin', 'superuser', 'supervisor')
  )
);
