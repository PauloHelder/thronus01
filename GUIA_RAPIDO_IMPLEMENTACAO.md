# 🚀 Guia Rápido de Implementação no Supabase

## Passo 1: Fazer Login no Supabase

1. Acesse: https://app.supabase.com
2. Faça login com sua conta
3. Selecione o projeto: **ujrthsaahokpsxhvzxqg**

## Passo 2: Abrir o SQL Editor

1. No menu lateral, clique em **SQL Editor** (ícone de código)
2. Clique em **New Query** para criar uma nova query

## Passo 3: Aplicar Schema Inicial

1. Abra o arquivo: `supabase\migrations\20241202_001_initial_schema.sql`
2. Copie TODO o conteúdo (Ctrl+A, Ctrl+C)
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione Ctrl+Enter)
5. Aguarde a execução (pode levar 10-30 segundos)
6. ✅ Verifique se aparece "Success. No rows returned"

## Passo 4: Aplicar Políticas RLS

1. Clique em **New Query** novamente
2. Abra o arquivo: `supabase\migrations\20241202_002_rls_policies.sql`
3. Copie TODO o conteúdo (Ctrl+A, Ctrl+C)
4. Cole no SQL Editor do Supabase
5. Clique em **Run** (ou pressione Ctrl+Enter)
6. Aguarde a execução (pode levar 10-20 segundos)
7. ✅ Verifique se aparece "Success. No rows returned"

## Passo 5: Aplicar Dados Mock (Opcional)

1. Clique em **New Query** novamente
2. Abra o arquivo: `supabase\seeds\seed.sql`
3. Copie TODO o conteúdo (Ctrl+A, Ctrl+C)
4. Cole no SQL Editor do Supabase
5. Clique em **Run** (ou pressione Ctrl+Enter)
6. Aguarde a execução (pode levar 5-10 segundos)
7. ✅ Verifique se aparece "Success. No rows returned"

## Passo 6: Verificar Instalação

### 6.1 Verificar Tabelas

1. No menu lateral, clique em **Table Editor**
2. Você deve ver todas as tabelas criadas:
   - churches
   - members
   - groups
   - services
   - departments
   - events
   - teaching_classes
   - discipleship_leaders
   - transactions
   - E muitas outras...

### 6.2 Verificar RLS

1. Volte ao **SQL Editor**
2. Clique em **New Query**
3. Cole e execute esta query:

```sql
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

4. ✅ Todas as tabelas devem ter `rls_enabled = true`

### 6.3 Verificar Dados Mock

1. No **SQL Editor**, execute:

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
SELECT 'Services', COUNT(*) FROM services;
```

2. ✅ Você deve ver:
   - Churches: 2
   - Plans: 3
   - Members: 12
   - Groups: 2
   - Departments: 7
   - Services: 3

## Passo 7: Configurar Autenticação (Opcional)

1. No menu lateral, clique em **Authentication**
2. Clique em **Providers**
3. Certifique-se de que **Email** está habilitado
4. Configure conforme necessário

## ✅ Pronto!

Seu backend está configurado! Agora você pode:

1. Testar queries no frontend
2. Criar usuários
3. Começar a desenvolver

## 🆘 Problemas?

Se encontrar erros:

1. **"permission denied"**: Certifique-se de estar logado como owner do projeto
2. **"relation already exists"**: As tabelas já foram criadas (tudo bem!)
3. **"syntax error"**: Verifique se copiou o arquivo completo

Consulte: `BACKEND_CHECKLIST.md` para mais troubleshooting

---

**Arquivos a serem executados na ordem:**
1. ✅ `supabase\migrations\20241202_001_initial_schema.sql`
2. ✅ `supabase\migrations\20241202_002_rls_policies.sql`
3. ✅ `supabase\seeds\seed.sql` (opcional)
