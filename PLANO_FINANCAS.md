# Plano de Implementação - Módulo de Finanças

## 1. Banco de Dados (Supabase)

Precisamos criar 3 tabelas principais:

### `financial_accounts` (Contas Bancárias / Caixas)
- `id`: UUID (PK)
- `church_id`: UUID (FK)
- `name`: VARCHAR (Ex: "Banco BAI", "Caixa Pequeno")
- `type`: VARCHAR (Ex: "bank", "cash")
- `initial_balance`: DECIMAL (Saldo inicial)
- `current_balance`: DECIMAL (Saldo atual - calculado ou atualizado via trigger/app)
- `is_active`: BOOLEAN

### `financial_categories` (Categorias)
- `id`: UUID (PK)
- `church_id`: UUID (FK)
- `name`: VARCHAR (Ex: "Dízimos", "Aluguel", "Equipamentos")
- `type`: VARCHAR ("income", "expense")
- `color`: VARCHAR (Para UI)

### `financial_transactions` (Transações)
- `id`: UUID (PK)
- `church_id`: UUID (FK)
- `description`: TEXT
- `amount`: DECIMAL
- `type`: VARCHAR ("income", "expense")
- `date`: DATE
- `category_id`: UUID (FK)
- `account_id`: UUID (FK)
- `status`: VARCHAR ("paid", "pending")
- `payment_method`: VARCHAR (Ex: "cash", "transfer", "card")
- `document_number`: VARCHAR (Opcional)
- `notes`: TEXT (Opcional)
- `created_by`: UUID (FK users)

## 2. Backend (Hooks & Logic)

### `useFinance.ts`
- **Contas:** `fetchAccounts`, `createAccount`, `updateAccount`, `deleteAccount`
- **Categorias:** `fetchCategories`, `createCategory`, `updateCategory`, `deleteCategory`
- **Transações:** `fetchTransactions` (com filtros de data/tipo), `createTransaction`, `updateTransaction`, `deleteTransaction`
- **Dashboard:** `getFinancialSummary` (Cálculo de totais do mês/período)

## 3. Frontend (UI)

### Páginas
- `src/pages/Finance.tsx`:
    - **Header:** Título e botões de ação (Nova Receita, Nova Despesa).
    - **Cards de Resumo:** Saldo Atual, Receitas do Mês, Despesas do Mês.
    - **Filtros:** Mês/Ano, Conta, Categoria.
    - **Tabela de Transações:** Listagem com colunas (Data, Descrição, Categoria, Valor, Status).
    - **Abas:** "Transações", "Contas", "Categorias".

### Modais
- `TransactionModal.tsx`: Formulário para criar/editar transação.
- `AccountModal.tsx`: Gerenciar contas.
- `CategoryModal.tsx`: Gerenciar categorias.

## 4. Segurança (RLS)
- Políticas estritas para garantir que usuários só vejam/editem finanças da sua própria `church_id`.
