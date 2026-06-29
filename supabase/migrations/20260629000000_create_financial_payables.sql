-- =====================================================
-- FINANCE MODULE - Accounts Payable Schema
-- Tables: financial_recurring_bills, financial_payable_installments
-- =====================================================

-- 1. Recurring Bills (Cabeçalho de Contas Recorrentes)
CREATE TABLE IF NOT EXISTS financial_recurring_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    category_id UUID REFERENCES financial_categories(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    periodicity VARCHAR(50) NOT NULL, -- 'diária', 'semanal', 'mensal', 'trimestral', 'anual'
    occurrences INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 2. Payable Installments (Parcelas Individuais a Pagar)
CREATE TABLE IF NOT EXISTS financial_payable_installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    recurring_bill_id UUID NOT NULL REFERENCES financial_recurring_bills(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'paid'
    paid_at TIMESTAMP WITH TIME ZONE,
    account_id UUID REFERENCES financial_accounts(id) ON DELETE SET NULL,
    transaction_id UUID REFERENCES financial_transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_recurring_bills_church ON financial_recurring_bills(church_id);
CREATE INDEX IF NOT EXISTS idx_payable_installments_church ON financial_payable_installments(church_id);
CREATE INDEX IF NOT EXISTS idx_payable_installments_bill ON financial_payable_installments(recurring_bill_id);
CREATE INDEX IF NOT EXISTS idx_payable_installments_due_date ON financial_payable_installments(due_date);

-- Triggers for updated_at
CREATE OR REPLACE TRIGGER update_financial_recurring_bills_modtime
    BEFORE UPDATE ON financial_recurring_bills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_financial_payable_installments_modtime
    BEFORE UPDATE ON financial_payable_installments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE financial_recurring_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_payable_installments ENABLE ROW LEVEL SECURITY;

-- Policies for financial_recurring_bills
CREATE POLICY "Users can view recurring bills from their church" ON financial_recurring_bills
    FOR SELECT USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert recurring bills for their church" ON financial_recurring_bills
    FOR INSERT WITH CHECK (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update recurring bills from their church" ON financial_recurring_bills
    FOR UPDATE USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete recurring bills from their church" ON financial_recurring_bills
    FOR DELETE USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Service role bypass" ON financial_recurring_bills
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Policies for financial_payable_installments
CREATE POLICY "Users can view installments from their church" ON financial_payable_installments
    FOR SELECT USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert installments for their church" ON financial_payable_installments
    FOR INSERT WITH CHECK (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update installments from their church" ON financial_payable_installments
    FOR UPDATE USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete installments from their church" ON financial_payable_installments
    FOR DELETE USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Service role bypass" ON financial_payable_installments
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');
