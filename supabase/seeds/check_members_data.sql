-- Verificar se os membros estão sendo salvos no banco

-- 1. Contar total de membros
SELECT COUNT(*) as total_members FROM members;

-- 2. Ver os últimos 10 membros cadastrados (ordenados por data de criação)
SELECT 
    id,
    name,
    email,
    phone,
    church_id,
    created_at
FROM members 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Ver todos os church_ids únicos na tabela members
SELECT DISTINCT church_id, COUNT(*) as members_count
FROM members
GROUP BY church_id;

SELECT 'Verificação de dados concluída.' as status;
