# Checklist de Verificação - Backend Thronus V5

Use este checklist para verificar se tudo foi configurado corretamente.

## ✅ Pré-requisitos

- [ ] Conta no Supabase criada
- [ ] Projeto Supabase criado
- [ ] Arquivo `.env` configurado com credenciais
- [ ] Node.js e npm instalados

## ✅ Migrações do Banco de Dados

### Schema Inicial
- [ ] Migração `20241202_001_initial_schema.sql` aplicada
- [ ] Todas as 31 tabelas criadas
- [ ] Índices criados
- [ ] Triggers criados
- [ ] Constraints aplicados

### Políticas RLS
- [ ] Migração `20241202_002_rls_policies.sql` aplicada
- [ ] RLS habilitado em todas as tabelas
- [ ] Funções helper criadas (`get_user_church_id`, `is_admin`, etc.)
- [ ] Políticas de SELECT criadas
- [ ] Políticas de INSERT criadas
- [ ] Políticas de UPDATE criadas
- [ ] Políticas de DELETE criadas

### Dados Mock (Opcional)
- [ ] Seed `seed.sql` aplicado
- [ ] 3 Planos criados
- [ ] 2 Igrejas criadas
- [ ] 12 Membros criados
- [ ] 2 Grupos criados
- [ ] 7 Departamentos criados
- [ ] 3 Cultos criados
- [ ] Categorias financeiras criadas

## ✅ Verificação do Banco

Execute estas queries no SQL Editor do Supabase:

### 1. Verificar Tabelas
```sql
SELECT 
    schemaname,
    COUNT(*) as table_count
FROM pg_tables 
WHERE schemaname = 'public'
GROUP BY schemaname;
```
**Esperado:** 31 tabelas

### 2. Verificar RLS
```sql
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```
**Esperado:** Todas as tabelas com `rls_enabled = true`

### 3. Verificar Funções
```sql
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND proname IN ('get_user_church_id', 'is_admin', 'user_has_permission', 'update_updated_at_column', 'generate_member_code');
```
**Esperado:** 5 funções

### 4. Verificar Triggers
```sql
SELECT 
    trigger_name,
    event_object_table as table_name,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
```
**Esperado:** 11+ triggers

### 5. Verificar Dados (se seed foi aplicado)
```sql
SELECT 'Churches' as entity, COUNT(*) as count FROM churches
UNION ALL
SELECT 'Plans', COUNT(*) FROM plans
UNION ALL
SELECT 'Members', COUNT(*) FROM members
UNION ALL
SELECT 'Groups', COUNT(*) FROM groups
UNION ALL
SELECT 'Departments', COUNT(*) FROM departments
UNION ALL
SELECT 'Services', COUNT(*) FROM services
UNION ALL
SELECT 'Events', COUNT(*) FROM events
UNION ALL
SELECT 'Transactions', COUNT(*) FROM transactions;
```
**Esperado:**
- Churches: 2
- Plans: 3
- Members: 12
- Groups: 2
- Departments: 7
- Services: 3
- Events: 2
- Transactions: 4

## ✅ Autenticação

### Configuração
- [ ] Email provider habilitado
- [ ] Confirm email configurado
- [ ] Email templates personalizados (opcional)

### Primeiro Usuário
- [ ] Usuário criado via Supabase Auth
- [ ] Registro criado na tabela `users`
- [ ] `church_id` vinculado corretamente
- [ ] Role definido como `admin`

### Teste de Login
```sql
-- Verificar se usuário existe
SELECT * FROM users WHERE email = 'seu-email@example.com';
```

## ✅ Frontend

### Configuração
- [ ] Arquivo `src/lib/supabase.ts` atualizado
- [ ] Tipos TypeScript criados (`src/types/database.types.ts`)
- [ ] Variáveis de ambiente configuradas

### Teste de Conexão
Execute no console do navegador:
```javascript
import { supabase } from './src/lib/supabase';

// Testar conexão
const { data, error } = await supabase.from('churches').select('count');
console.log('Conexão:', error ? 'ERRO' : 'OK', data);
```

## ✅ Testes de RLS

### Teste 1: Isolamento entre Igrejas
```sql
-- Como usuário da Igreja 1, tentar acessar dados da Igreja 2
-- Deve retornar vazio
SELECT * FROM members WHERE church_id = '10000000-0000-0000-0000-000000000002';
```

### Teste 2: Acesso aos Próprios Dados
```sql
-- Como usuário da Igreja 1, acessar dados da Igreja 1
-- Deve retornar dados
SELECT * FROM members WHERE church_id = '10000000-0000-0000-0000-000000000001';
```

### Teste 3: Permissões de Admin
```sql
-- Como admin, criar um membro
INSERT INTO members (church_id, name, email, status)
VALUES ('sua-church-id', 'Teste', 'teste@example.com', 'Active');
```

### Teste 4: Permissões de Membro
```sql
-- Como membro (não admin), tentar criar um membro
-- Deve falhar se não tiver permissão 'manage_members'
INSERT INTO members (church_id, name, email, status)
VALUES ('sua-church-id', 'Teste', 'teste@example.com', 'Active');
```

## ✅ Funcionalidades Automáticas

### Teste de Member Code
```sql
-- Criar membro sem member_code
INSERT INTO members (church_id, name, email, status)
VALUES ('sua-church-id', 'João Silva', 'joao@example.com', 'Active')
RETURNING member_code;

-- Verificar se member_code foi gerado automaticamente (M001, M002, etc.)
```

### Teste de Updated At
```sql
-- Atualizar um membro
UPDATE members 
SET name = 'Nome Atualizado' 
WHERE id = 'algum-id'
RETURNING updated_at;

-- Verificar se updated_at foi atualizado automaticamente
```

## ✅ Storage (Opcional)

Se for usar Storage para avatares:

- [ ] Bucket `avatars` criado
- [ ] Políticas de acesso configuradas
- [ ] Upload de teste realizado
- [ ] URL pública funcionando

```sql
-- Criar bucket via SQL
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Criar política de acesso
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');
```

## ✅ Performance

### Índices
```sql
-- Verificar índices criados
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```
**Esperado:** 50+ índices

### Queries Lentas
```sql
-- Habilitar log de queries lentas (opcional)
ALTER DATABASE postgres SET log_min_duration_statement = 1000;
```

## ✅ Documentação

- [ ] `supabase/README.md` lido
- [ ] `SUPABASE_SETUP_GUIDE.md` lido
- [ ] `BACKEND_IMPLEMENTATION.md` lido
- [ ] `src/lib/queries.examples.ts` revisado

## ✅ Backup e Segurança

### Backup
- [ ] Backup automático configurado no Supabase
- [ ] Frequência de backup definida
- [ ] Retenção de backup configurada

### Segurança
- [ ] Service Role Key guardada em segurança
- [ ] Anon Key exposta apenas no frontend
- [ ] RLS habilitado em produção
- [ ] HTTPS habilitado

## ✅ Monitoramento

- [ ] Logs do Supabase verificados
- [ ] Métricas de uso verificadas
- [ ] Alertas configurados (opcional)

## 🎯 Próximos Passos

Após completar este checklist:

1. **Desenvolvimento**
   - [ ] Implementar queries no frontend
   - [ ] Adicionar autenticação nas páginas
   - [ ] Implementar CRUD completo
   - [ ] Adicionar validações

2. **Testes**
   - [ ] Testar todas as funcionalidades
   - [ ] Testar isolamento multi-tenant
   - [ ] Testar permissões
   - [ ] Testar performance

3. **Deploy**
   - [ ] Configurar ambiente de produção
   - [ ] Migrar dados reais
   - [ ] Configurar domínio customizado
   - [ ] Configurar SSL

## 📊 Status Geral

- [ ] ✅ Todas as verificações passaram
- [ ] ⚠️ Algumas verificações falharam (ver detalhes acima)
- [ ] ❌ Muitas verificações falharam (revisar configuração)

## 🆘 Troubleshooting

Se alguma verificação falhar:

1. **Tabelas não criadas**
   - Verificar se migração foi executada
   - Verificar logs de erro no Supabase
   - Tentar executar novamente

2. **RLS bloqueando queries**
   - Verificar se usuário está na tabela `users`
   - Verificar se `church_id` está correto
   - Verificar permissões do usuário

3. **Dados não aparecem**
   - Verificar RLS
   - Verificar filtros de query
   - Verificar soft delete (`deleted_at`)

4. **Erros de permissão**
   - Verificar role do usuário
   - Verificar permissões específicas
   - Verificar políticas RLS

## 📞 Suporte

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

**Data:** ___/___/______
**Verificado por:** _________________
**Status:** [ ] Aprovado [ ] Pendente [ ] Reprovado
