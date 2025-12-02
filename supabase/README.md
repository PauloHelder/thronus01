# Thronus V5 - Database Setup

Este diretório contém as migrações e seeds do banco de dados Supabase para o sistema Thronus V5.

## Estrutura

```
supabase/
├── migrations/
│   ├── 20241202_001_initial_schema.sql    # Schema inicial com todas as tabelas
│   └── 20241202_002_rls_policies.sql      # Políticas RLS para isolamento multi-tenant
└── seeds/
    └── seed.sql                            # Dados mock para desenvolvimento
```

## Aplicando as Migrações

### Opção 1: Via Supabase Dashboard (Recomendado para desenvolvimento)

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá para **SQL Editor**
4. Execute os arquivos na seguinte ordem:

   **Passo 1:** Execute `migrations/20241202_001_initial_schema.sql`
   - Cria todas as tabelas do sistema
   - Configura índices e triggers
   - Define constraints e relacionamentos

   **Passo 2:** Execute `migrations/20241202_002_rls_policies.sql`
   - Habilita Row Level Security em todas as tabelas
   - Cria políticas de isolamento multi-tenant
   - Define funções helper para verificação de permissões

   **Passo 3 (Opcional):** Execute `seeds/seed.sql`
   - Popula o banco com dados mock para teste
   - Cria 2 igrejas de exemplo
   - Adiciona membros, grupos, departamentos, etc.

### Opção 2: Via Supabase CLI

Se você tiver o Supabase CLI instalado:

```bash
# Inicializar o projeto Supabase (se ainda não foi feito)
supabase init

# Link com seu projeto remoto
supabase link --project-ref your-project-ref

# Aplicar migrações
supabase db push

# Aplicar seeds (opcional)
supabase db seed
```

### Opção 3: Via Script SQL Direto

Você pode copiar e colar o conteúdo de cada arquivo diretamente no SQL Editor do Supabase Dashboard.

## Schema do Banco de Dados

### Tabelas Principais

#### **Churches (Igrejas/Tenants)**
- Tabela principal de multi-tenancy
- Cada igreja é um tenant isolado
- Suporta hierarquia (parent_church_id) para redes de igrejas

#### **Members (Membros)**
- Membros de cada igreja
- Código único por igreja (M001, M002, etc.)
- Informações pessoais, endereço, batismo
- Soft delete (deleted_at)

#### **Groups (Células)**
- Grupos/células da igreja
- Líderes e co-líderes
- Informações de reunião
- Membros com roles específicos

#### **Services (Cultos)**
- Cultos e reuniões
- Estatísticas de presença
- Pregadores e líderes

#### **Departments (Departamentos/Ministérios)**
- Departamentos da igreja
- 3 departamentos padrão: Secretaria, Finanças, Louvor
- Membros e escalas

#### **Events (Eventos)**
- Eventos diversos da igreja
- Participantes

#### **Teaching (Ensino)**
- Classes de ensino
- Estágios cristãos (configurável)
- Categorias de ensino (configurável)
- Lições e presença

#### **Discipleship (Discipulado)**
- Líderes de discipulado
- Relacionamentos líder-discípulo
- Reuniões e presença

#### **Finance (Finanças)**
- Categorias de transação
- Receitas e despesas
- Referências a cultos e membros

#### **Audit Logs**
- Log de todas as ações no sistema
- Rastreamento de mudanças

## Row Level Security (RLS)

Todas as tabelas têm RLS habilitado para garantir isolamento completo entre igrejas:

### Princípios de Segurança

1. **Isolamento por Igreja**: Usuários só podem ver dados da sua própria igreja
2. **Controle de Permissões**: Baseado em roles (admin, leader, member) e permissões específicas
3. **Service Role Bypass**: Service role pode acessar tudo (para migrações e seeds)

### Funções Helper

- `get_user_church_id()`: Retorna o church_id do usuário autenticado
- `is_admin()`: Verifica se o usuário é admin
- `user_has_permission(permission_name)`: Verifica permissões específicas

### Exemplo de Política RLS

```sql
-- Usuários só podem ver membros da sua igreja
CREATE POLICY "Users can view members from their church"
ON members FOR SELECT
USING (church_id = get_user_church_id() AND deleted_at IS NULL);
```

## Dados Mock (Seeds)

O arquivo `seeds/seed.sql` cria:

### Planos
- **Free**: Até 50 membros, 5 grupos, recursos básicos
- **Profissional**: 500 membros, 50 grupos, estatísticas e exportação
- **Premium**: Ilimitado, todos os recursos

### Igrejas de Exemplo
1. **Igreja Evangélica Assembleia de Deus** (Luanda)
   - Plano Profissional
   - 10 membros
   - 2 grupos
   - 4 departamentos
   - Cultos e eventos

2. **Igreja Batista Central** (Benguela)
   - Plano Free (trial)
   - 2 membros
   - Departamentos padrão

## Triggers Automáticos

### `update_updated_at_column()`
Atualiza automaticamente o campo `updated_at` em todas as tabelas relevantes.

### `generate_member_code()`
Gera automaticamente códigos únicos para membros (M001, M002, etc.) por igreja.

## Próximos Passos

Após aplicar as migrações:

1. **Configurar Autenticação**
   - Habilitar Email/Password ou OTP no Supabase Auth
   - Configurar email templates

2. **Criar Primeiro Usuário Admin**
   ```sql
   -- Após criar usuário via Supabase Auth
   INSERT INTO users (id, church_id, email, role)
   VALUES (
     'auth-user-id',
     'church-id',
     'admin@church.com',
     'admin'
   );
   ```

3. **Configurar Storage (Opcional)**
   - Para avatares de membros
   - Para logos de igrejas
   - Para documentos

4. **Testar Políticas RLS**
   - Criar usuários de teste
   - Verificar isolamento entre igrejas
   - Testar permissões

## Troubleshooting

### Erro: "permission denied for schema public"
- Certifique-se de estar usando o service role key para migrações
- Ou execute via Supabase Dashboard com usuário admin

### Erro: "relation already exists"
- As tabelas já foram criadas
- Use `DROP TABLE IF EXISTS` se precisar recriar (cuidado em produção!)

### RLS bloqueando queries
- Verifique se o usuário está na tabela `users`
- Verifique se `church_id` está correto
- Use service role key para bypass (apenas desenvolvimento)

## Manutenção

### Criar Nova Migração

```bash
# Via CLI
supabase migration new migration_name

# Ou crie manualmente
# supabase/migrations/YYYYMMDD_NNN_description.sql
```

### Rollback (Cuidado!)

```sql
-- Desabilitar RLS (apenas desenvolvimento)
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- Dropar tabelas (perda de dados!)
DROP TABLE IF EXISTS table_name CASCADE;
```

## Recursos Adicionais

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
