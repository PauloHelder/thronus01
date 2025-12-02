# Guia de Aplicação das Migrações no Supabase

Este guia mostra como aplicar as migrações do Thronus V5 no seu projeto Supabase.

## Pré-requisitos

- Conta no Supabase (https://app.supabase.com)
- Projeto Supabase criado
- Credenciais do projeto (URL e Keys)

## Passo 1: Configurar Variáveis de Ambiente

1. Copie o arquivo `.env.example` para `.env`:
   ```bash
   copy .env.example .env
   ```

2. Edite o arquivo `.env` e adicione suas credenciais do Supabase:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-anon-key
   SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
   ```

   **Onde encontrar as credenciais:**
   - Acesse https://app.supabase.com
   - Selecione seu projeto
   - Vá em **Settings** > **API**
   - Copie a **Project URL** e as **Keys**

## Passo 2: Aplicar Migrações via Dashboard

### 2.1 - Criar Schema Inicial

1. Acesse o **SQL Editor** no Supabase Dashboard
2. Clique em **New Query**
3. Abra o arquivo `supabase/migrations/20241202_001_initial_schema.sql`
4. Copie todo o conteúdo
5. Cole no SQL Editor
6. Clique em **Run** (ou pressione Ctrl+Enter)
7. Aguarde a execução (pode levar alguns segundos)
8. Verifique se não há erros

### 2.2 - Aplicar Políticas RLS

1. No **SQL Editor**, clique em **New Query**
2. Abra o arquivo `supabase/migrations/20241202_002_rls_policies.sql`
3. Copie todo o conteúdo
4. Cole no SQL Editor
5. Clique em **Run**
6. Aguarde a execução
7. Verifique se não há erros

### 2.3 - Inserir Dados Mock (Opcional)

1. No **SQL Editor**, clique em **New Query**
2. Abra o arquivo `supabase/seeds/seed.sql`
3. Copie todo o conteúdo
4. Cole no SQL Editor
5. Clique em **Run**
6. Aguarde a execução
7. Verifique se não há erros

## Passo 3: Verificar a Instalação

### 3.1 - Verificar Tabelas

1. No Supabase Dashboard, vá para **Table Editor**
2. Você deve ver todas as tabelas criadas:
   - churches
   - plans
   - subscriptions
   - members
   - users
   - groups
   - services
   - departments
   - events
   - teaching_classes
   - discipleship_leaders
   - transactions
   - audit_logs
   - E muitas outras...

### 3.2 - Verificar RLS

1. No **SQL Editor**, execute:
   ```sql
   SELECT 
       tablename,
       rowsecurity as rls_enabled
   FROM pg_tables 
   WHERE schemaname = 'public'
   ORDER BY tablename;
   ```

2. Todas as tabelas devem ter `rls_enabled = true`

### 3.3 - Verificar Dados Mock

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

3. Você deve ver:
   - 2 Churches
   - 3 Plans
   - 12 Members
   - 2 Groups
   - 7 Departments
   - 3 Services

## Passo 4: Configurar Autenticação

### 4.1 - Habilitar Providers

1. Vá para **Authentication** > **Providers**
2. Habilite **Email**
3. Configure as opções:
   - ✅ Enable Email provider
   - ✅ Confirm email
   - ✅ Secure email change

### 4.2 - Configurar Email Templates (Opcional)

1. Vá para **Authentication** > **Email Templates**
2. Personalize os templates de:
   - Confirmation
   - Magic Link
   - Change Email
   - Reset Password

## Passo 5: Criar Primeiro Usuário Admin

### 5.1 - Criar Usuário via Auth

1. Vá para **Authentication** > **Users**
2. Clique em **Add user**
3. Preencha:
   - Email: admin@suaigreja.com
   - Password: (senha forte)
   - ✅ Auto Confirm User
4. Clique em **Create user**
5. **Copie o User ID** que aparece

### 5.2 - Vincular Usuário a uma Igreja

1. No **SQL Editor**, execute (substitua os IDs):
   ```sql
   -- Usar uma das igrejas criadas no seed
   -- Igreja 1: 10000000-0000-0000-0000-000000000001 (IEAD Luanda)
   -- Igreja 2: 10000000-0000-0000-0000-000000000002 (IBC Benguela)
   
   INSERT INTO users (id, church_id, email, role, permissions)
   VALUES (
     'cole-o-user-id-aqui',
     '10000000-0000-0000-0000-000000000001', -- ID da igreja
     'admin@suaigreja.com',
     'admin',
     '{}'::jsonb
   );
   ```

## Passo 6: Testar a Aplicação

1. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Acesse http://localhost:5173

3. Faça login com o usuário admin criado

4. Verifique se consegue:
   - Ver membros da igreja
   - Ver grupos
   - Ver departamentos
   - Ver cultos
   - Etc.

## Troubleshooting

### Erro: "permission denied for schema public"

**Solução:** Certifique-se de estar executando as queries com um usuário que tem permissões de admin no Supabase.

### Erro: "relation already exists"

**Solução:** As tabelas já foram criadas. Se quiser recriar:

1. **CUIDADO:** Isso apaga todos os dados!
2. Execute no SQL Editor:
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   GRANT ALL ON SCHEMA public TO postgres;
   GRANT ALL ON SCHEMA public TO public;
   ```
3. Execute as migrações novamente

### Erro: "RLS policy blocks query"

**Solução:** 
- Verifique se o usuário está na tabela `users`
- Verifique se o `church_id` está correto
- Para testes, você pode temporariamente desabilitar RLS:
  ```sql
  ALTER TABLE nome_da_tabela DISABLE ROW LEVEL SECURITY;
  ```

### Não consigo ver dados após login

**Solução:**
1. Verifique se o usuário foi inserido na tabela `users`
2. Verifique se o `church_id` está correto
3. Execute no SQL Editor:
   ```sql
   SELECT * FROM users WHERE id = 'seu-user-id';
   ```

## Próximos Passos

Após a instalação bem-sucedida:

1. ✅ Configurar Storage para avatares e logos
2. ✅ Personalizar email templates
3. ✅ Configurar backup automático
4. ✅ Configurar webhooks (se necessário)
5. ✅ Implementar audit logging no frontend
6. ✅ Testar todas as funcionalidades

## Recursos Úteis

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Supabase Discord](https://discord.supabase.com/)

## Suporte

Se encontrar problemas:

1. Verifique os logs no Supabase Dashboard (**Logs** > **Database**)
2. Consulte a documentação do Supabase
3. Verifique o arquivo `supabase/README.md` para mais detalhes
