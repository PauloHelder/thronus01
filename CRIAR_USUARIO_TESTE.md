# 🔑 Criar Usuário de Teste - Guia Rápido

## 📋 Credenciais do Usuário de Teste

```
Email: teste@thronus.com
Senha: teste123
```

## 🚀 Passo a Passo

### Opção 1: Criar pelo Site (RECOMENDADO)

1. **Acesse:** http://localhost:3000/#/signup
2. **Preencha o formulário:**

**Passo 1 - Dados Básicos:**
- Nome da Igreja: `Igreja de Teste`
- Sigla: `IT`
- Denominação: (escolha qualquer uma)
- NIF: `999999999`
- Categoria: `Sede`

**Passo 2 - Localização:**
- Endereço: `Rua de Teste, 123`
- Província: `Luanda`
- Município: `Viana`
- Bairro: `Bairro Teste`

**Passo 3 - Contato e Senha:**
- Email: `teste@thronus.com`
- Telefone: `+244 923 000 000`
- Nome do Pastor: `Pastor Teste`
- Senha: `teste123`
- Confirmar Senha: `teste123`
- ✅ Aceitar termos

3. **Clique em "Criar Igreja"**
4. **Aguarde** o processamento
5. **Pronto!** Você será redirecionado para o dashboard

---

### Opção 2: Criar Manualmente no Supabase

Se preferir criar manualmente com dados de teste completos:

#### Passo 1: Criar Usuário no Supabase Auth

1. Acesse o **Supabase Dashboard**
2. Vá para **Authentication > Users**
3. Clique em **Add User**
4. Preencha:
   - Email: `teste@thronus.com`
   - Password: `teste123`
   - ✅ Auto Confirm User
5. Clique em **Create User**
6. **IMPORTANTE:** Copie o **User ID** que aparece

#### Passo 2: Executar Script SQL

1. Abra o arquivo: `supabase/seeds/criar_usuario_teste.sql`
2. **Encontre a linha:**
   ```sql
   'USER-ID-AQUI', -- COLE O ID DO USUÁRIO DO SUPABASE AUTH AQUI
   ```
3. **Substitua** `'USER-ID-AQUI'` pelo ID copiado no passo anterior
4. **Copie todo o script**
5. No Supabase Dashboard, vá para **SQL Editor**
6. Clique em **New Query**
7. **Cole o script**
8. Clique em **Run**
9. **Aguarde** a execução

#### Passo 3: Verificar

Execute esta query para verificar:

```sql
SELECT 
    'Churches' as entity, 
    COUNT(*) as count 
FROM churches 
WHERE email = 'teste@thronus.com'

UNION ALL

SELECT 'Members', COUNT(*) 
FROM members 
WHERE church_id IN (SELECT id FROM churches WHERE email = 'teste@thronus.com')

UNION ALL

SELECT 'Groups', COUNT(*) 
FROM groups 
WHERE church_id IN (SELECT id FROM churches WHERE email = 'teste@thronus.com');
```

**Resultado esperado:**
- Churches: 1
- Members: 6
- Groups: 2

---

## 🎯 O que será criado (Opção 2)

### Igreja
- ✅ 1 Igreja de Teste
- ✅ Plano Profissional ativo

### Membros
- ✅ Pastor Teste (você)
- ✅ João Silva
- ✅ Maria Santos
- ✅ Pedro Costa
- ✅ Ana Oliveira
- ✅ Carlos Ferreira

### Grupos
- ✅ Célula Central (Líder: Maria Santos)
- ✅ Grupo de Homens (Líder: João Silva)

### Departamentos
- ✅ Secretaria
- ✅ Finanças
- ✅ Louvor

### Eventos
- ✅ Culto de Domingo (daqui a 3 dias)
- ✅ Encontro de Jovens (daqui a 5 dias)
- ✅ Ação Social (daqui a 7 dias)

### Finanças
- ✅ 3 Receitas (Dízimos e Ofertas)
- ✅ 1 Despesa (Aluguel)
- ✅ Total: ~90.000 AOA em receitas, 30.000 AOA em despesas

### Categorias
- ✅ 6 Categorias financeiras
- ✅ 4 Estágios cristãos
- ✅ 5 Categorias de ensino

---

## 🔐 Fazer Login

1. **Acesse:** http://localhost:3000/#/login
2. **Preencha:**
   - Email: `teste@thronus.com`
   - Senha: `teste123`
3. **Clique em "Entrar"**
4. **Pronto!** Você verá o dashboard com todos os dados

---

## 📊 O que você verá no Dashboard

- **Total de Membros:** 6
- **Membros Ativos:** 6
- **Grupos Ativos:** 2 de 2
- **Próximos Eventos:** 3
- **Saldo do Mês:** ~60.000 AOA
- **Gráfico de Crescimento:** Dados dos últimos 6 meses
- **Gráfico Financeiro:** Receitas vs Despesas
- **Status dos Membros:** 100% ativos

---

## 🔄 Resetar Dados de Teste

Se quiser limpar e começar de novo:

```sql
-- Deletar tudo da igreja de teste
DELETE FROM churches WHERE email = 'teste@thronus.com';
-- O CASCADE vai deletar automaticamente todos os dados relacionados
```

Depois é só executar o script novamente!

---

## 💡 Dicas

### Para testar o sistema completo:

1. ✅ **Adicione um novo membro** pelo dashboard
2. ✅ **Crie um novo evento**
3. ✅ **Adicione uma transação financeira**
4. ✅ **Crie um novo grupo**
5. ✅ **Veja os gráficos atualizarem**

### Para testar permissões:

1. Crie outro usuário com role `member`
2. Faça login e veja as diferenças de acesso

---

## ⚠️ Importante

- Este é um **usuário de teste** apenas para desenvolvimento
- **NÃO use em produção**
- Os dados são **fictícios**
- Você pode **modificar** qualquer coisa sem medo

---

## 🎉 Pronto!

Agora você tem um usuário de teste completo com:
- ✅ Igreja configurada
- ✅ Membros cadastrados
- ✅ Grupos ativos
- ✅ Eventos agendados
- ✅ Transações financeiras
- ✅ Dashboard funcional

**Bom teste!** 🚀
