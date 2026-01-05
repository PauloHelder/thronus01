-- Arquivo para popular categorias financeiras padrão
-- Para executar, rode este comando no SQL Editor do Supabase ou via CLI se configurado
-- Copie e cole o conteúdo abaixo

-- Receitas (Income)
INSERT INTO public.financial_categories (church_id, name, type, is_system)
SELECT 
    id as church_id, 
    'Dízimo' as name, 
    'income' as type, 
    true as is_system 
FROM public.churches
WHERE NOT EXISTS (SELECT 1 FROM public.financial_categories WHERE name = 'Dízimo' AND church_id = public.churches.id);

INSERT INTO public.financial_categories (church_id, name, type, is_system)
SELECT 
    id as church_id, 
    'Oferta' as name, 
    'income' as type, 
    true as is_system 
FROM public.churches
WHERE NOT EXISTS (SELECT 1 FROM public.financial_categories WHERE name = 'Oferta' AND church_id = public.churches.id);

INSERT INTO public.financial_categories (church_id, name, type, is_system)
SELECT 
    id as church_id, 
    'Doação' as name, 
    'income' as type, 
    true as is_system 
FROM public.churches
WHERE NOT EXISTS (SELECT 1 FROM public.financial_categories WHERE name = 'Doação' AND church_id = public.churches.id);

-- Despesas (Expense)
INSERT INTO public.financial_categories (church_id, name, type, is_system)
SELECT 
    id as church_id, 
    'Aluguel' as name, 
    'expense' as type, 
    true as is_system 
FROM public.churches
WHERE NOT EXISTS (SELECT 1 FROM public.financial_categories WHERE name = 'Aluguel' AND church_id = public.churches.id);

INSERT INTO public.financial_categories (church_id, name, type, is_system)
SELECT 
    id as church_id, 
    'Salários' as name, 
    'expense' as type, 
    true as is_system 
FROM public.churches
WHERE NOT EXISTS (SELECT 1 FROM public.financial_categories WHERE name = 'Salários' AND church_id = public.churches.id);

INSERT INTO public.financial_categories (church_id, name, type, is_system)
SELECT 
    id as church_id, 
    'Conta de Luz' as name, 
    'expense' as type, 
    true as is_system 
FROM public.churches
WHERE NOT EXISTS (SELECT 1 FROM public.financial_categories WHERE name = 'Conta de Luz' AND church_id = public.churches.id);

INSERT INTO public.financial_categories (church_id, name, type, is_system)
SELECT 
    id as church_id, 
    'Manutenção' as name, 
    'expense' as type, 
    true as is_system 
FROM public.churches
WHERE NOT EXISTS (SELECT 1 FROM public.financial_categories WHERE name = 'Manutenção' AND church_id = public.churches.id);
