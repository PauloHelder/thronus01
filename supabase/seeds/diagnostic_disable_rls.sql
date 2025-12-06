-- Script de DIAGNÓSTICO: Desabilita RLS temporariamente para teste
-- ATENÇÃO: Este script remove a segurança. Use apenas para diagnóstico.
-- Após confirmar que funciona, execute fix_rls_final.sql novamente.

-- 1. Desabilitar RLS na tabela members (TEMPORÁRIO - APENAS PARA TESTE)
ALTER TABLE members DISABLE ROW LEVEL SECURITY;

-- 2. Verificar se há algum membro cadastrado
SELECT COUNT(*) as total_members FROM members;

-- 3. Ver os últimos 5 membros cadastrados
SELECT id, name, email, church_id, created_at 
FROM members 
ORDER BY created_at DESC 
LIMIT 5;

SELECT 'RLS DESABILITADO. Teste o cadastro agora. Se funcionar, o problema é RLS.' as status;
