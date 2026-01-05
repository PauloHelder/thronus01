-- Habilita RLS na tabela churches por segurança
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;

-- Permite que usuários autenticados visualizem os dados da sua própria igreja
DROP POLICY IF EXISTS "Users can view their own church" ON public.churches;
CREATE POLICY "Users can view their own church"
ON public.churches FOR SELECT
TO authenticated
USING (
  id = (SELECT church_id FROM public.users WHERE id = auth.uid() LIMIT 1)
);

-- Permite que Admins, Superusers e Supervisores atualizem os dados da sua igreja
DROP POLICY IF EXISTS "Admins can update their own church" ON public.churches;
CREATE POLICY "Admins can update their own church"
ON public.churches FOR UPDATE
TO authenticated
USING (
  id = (SELECT church_id FROM public.users WHERE id = auth.uid() LIMIT 1)
  -- Adiciona verificação de role na atualização também
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superuser', 'supervisor')
  )
);
