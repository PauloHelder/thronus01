# Diagnóstico e Correção do Fluxo de Cadastro

## 🔍 Problema Identificado

Você relatou que:
1. Ao cadastrar novos usuários, não está criando uma nova igreja
2. Está atualizando a tabela `users` mas não criando novos registros
3. Ao adicionar membros, eles não são criados no banco

## 📋 Fluxo Esperado de Cadastro

### 1. Cadastro de Nova Igreja (SignupPage)
Quando um usuário se cadastra pela primeira vez:

```
SignupPage → AuthContext.signup() → Supabase Auth → RPC complete_signup()
```

A função `complete_signup` deve:
1. ✅ Criar um registro na tabela `churches`
2. ✅ Criar um registro na tabela `members` (o pastor)
3. ✅ Criar um registro na tabela `users` (vinculando ao Auth)
4. ✅ Criar dados padrão (departamentos, categorias, etc.)

### 2. Login
Quando um usuário faz login:

```
LoginPage → AuthContext.login() → Supabase Auth → checkSession()
```

A função `checkSession` deve:
1. ✅ Buscar dados do usuário na tabela `users`
2. ✅ Carregar `church_id` e `member_id`
3. ✅ Atualizar o estado local do AuthContext

### 3. Adicionar Membro
Quando um usuário logado adiciona um membro:

```
MemberModal → useMembers.addMember() → Supabase INSERT → members table
```

O hook `useMembers` deve:
1. ✅ Pegar o `church_id` do usuário logado
2. ✅ Inserir o membro com esse `church_id`
3. ✅ Retornar o membro criado

## 🛠️ Passos para Diagnóstico

### Passo 1: Verificar Estado Atual do Banco
Execute o script `diagnostic_full_flow.sql` no Supabase SQL Editor.

Isso vai mostrar:
- Se a função `complete_signup` existe
- Quantas igrejas, usuários e membros existem
- Se há dados duplicados ou inconsistentes

### Passo 2: Verificar se a Função RPC Está Registrada
Execute no Supabase SQL Editor:

```sql
SELECT * FROM pg_proc WHERE proname = 'complete_signup';
```

Se retornar vazio, você precisa executar o script `create_signup_rpc.sql`.

### Passo 3: Testar o Cadastro com Logs
1. Abra o console do navegador (F12)
2. Tente criar um novo usuário
3. Procure por erros que começam com:
   - `Auth signup error:`
   - `RPC Signup error:`
   - `RPC Signup logic error:`

### Passo 4: Verificar RLS (Row Level Security)
As políticas RLS podem estar bloqueando:
- A leitura da tabela `users` (impedindo `checkSession`)
- A inserção na tabela `members` (impedindo `addMember`)

Execute o script `fix_rls_final.sql` para corrigir.

## 🔧 Soluções Rápidas

### Solução 1: Recriar a Função RPC
Se a função `complete_signup` não existir ou estiver desatualizada:

```bash
# Execute no Supabase SQL Editor:
supabase/seeds/create_signup_rpc.sql
```

### Solução 2: Corrigir Permissões RLS
Se o RLS estiver bloqueando operações:

```bash
# Execute no Supabase SQL Editor:
supabase/seeds/fix_rls_final.sql
```

### Solução 3: Limpar Dados Inconsistentes
Se houver usuários sem `church_id` ou membros órfãos:

```bash
# Execute no Supabase SQL Editor:
supabase/seeds/limpar_usuario_bugado.sql
```

## 📊 Checklist de Verificação

- [ ] A função `complete_signup` existe no banco?
- [ ] O cadastro retorna erro no console?
- [ ] O usuário é criado no Supabase Auth mas não na tabela `users`?
- [ ] O `church_id` do usuário logado é `null` ou `undefined`?
- [ ] Os membros aparecem na tabela `members` do Supabase?
- [ ] O RLS está habilitado nas tabelas `users` e `members`?

## 🎯 Próximos Passos

1. **Execute `diagnostic_full_flow.sql`** e me envie os resultados
2. **Tente criar um novo usuário** e me envie os logs do console
3. **Verifique se o usuário aparece na tabela `users`** do Supabase
4. **Verifique se a igreja foi criada** na tabela `churches`

Com essas informações, posso identificar exatamente onde o fluxo está quebrando.
