-- =====================================================
-- FINANCE MODULE - Database Schema
-- Tables: financial_accounts, financial_categories, financial_transactions
-- =====================================================

-- 1. Financial Accounts (Contas Bancárias / Caixas)
CREATE TABLE IF NOT EXISTS financial_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'bank', -- 'bank', 'cash', 'investment'
    initial_balance DECIMAL(15, 2) DEFAULT 0.00,
    current_balance DECIMAL(15, 2) DEFAULT 0.00, -- Pode ser atualizado via trigger ou app
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 2. Financial Categories (Categorias)
CREATE TABLE IF NOT EXISTS financial_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'income', 'expense'
    color VARCHAR(50), -- Hex code para UI
    is_system BOOLEAN DEFAULT false, -- Se true, não pode ser deletada (ex: Dízimos)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 3. Financial Transactions (Transações)
CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'income', 'expense'
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category_id UUID REFERENCES financial_categories(id) ON DELETE SET NULL,
    account_id UUID REFERENCES financial_accounts(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'paid', -- 'paid', 'pending'
    payment_method VARCHAR(50), -- 'cash', 'transfer', 'card', 'check', 'pix'
    document_number VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_finance_accounts_church ON financial_accounts(church_id);
CREATE INDEX IF NOT EXISTS idx_finance_categories_church ON financial_categories(church_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_church ON financial_transactions(church_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_date ON financial_transactions(date);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_type ON financial_transactions(type);

-- Triggers for updated_at
CREATE OR REPLACE TRIGGER update_financial_accounts_modtime
    BEFORE UPDATE ON financial_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_financial_categories_modtime
    BEFORE UPDATE ON financial_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_financial_transactions_modtime
    BEFORE UPDATE ON financial_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
