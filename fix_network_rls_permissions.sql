-- 1. Permitir que a Igreja Mãe (Sede) visualize MEMBROS das Filiais
-- Regra: O usuário deve ser da igreja mãe (parent_id) E a filial deve ter habilitado 'view_members'
DROP POLICY IF EXISTS "Parent church view members" ON public.members;
CREATE POLICY "Parent church view members" ON public.members
FOR SELECT
TO authenticated
USING (
   church_id IN (
      SELECT id FROM public.churches
      WHERE parent_id = (SELECT church_id FROM public.users WHERE id = auth.uid())
      AND (settings->'shared_permissions'->>'view_members')::boolean IS TRUE
   )
);

-- 2. Permitir que a Igreja Mãe visualize CULTOS (Relatórios)
-- Regra: O usuário deve ser da igreja mãe E a filial deve ter habilitado 'view_service_stats'
DROP POLICY IF EXISTS "Parent church view services" ON public.services;
CREATE POLICY "Parent church view services" ON public.services
FOR SELECT
TO authenticated
USING (
   church_id IN (
      SELECT id FROM public.churches
      WHERE parent_id = (SELECT church_id FROM public.users WHERE id = auth.uid())
      AND (settings->'shared_permissions'->>'view_service_stats')::boolean IS TRUE
   )
);

-- 3. Permitir que a Igreja Mãe visualize TRANSAÇÕES FINANCEIRAS
-- Regra: O usuário deve ser da igreja mãe E a filial deve ter habilitado 'view_financials'
-- Nota: Caso a tabela se chame apenas 'transactions', ajuste o nome abaixo.
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'financial_transactions') THEN
        DROP POLICY IF EXISTS "Parent church view financials" ON public.financial_transactions;
        CREATE POLICY "Parent church view financials" ON public.financial_transactions
        FOR SELECT
        TO authenticated
        USING (
           church_id IN (
              SELECT id FROM public.churches
              WHERE parent_id = (SELECT church_id FROM public.users WHERE id = auth.uid())
              AND (settings->'shared_permissions'->>'view_financials')::boolean IS TRUE
           )
        );
    END IF;
END
$$;
