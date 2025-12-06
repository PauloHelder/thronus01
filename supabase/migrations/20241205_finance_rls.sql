-- =====================================================
-- FINANCE MODULE - Row Level Security Policies
-- =====================================================

-- 1. Enable RLS
ALTER TABLE financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

-- 2. Policies for financial_accounts
CREATE POLICY "Users can view accounts from their church" ON financial_accounts
    FOR SELECT USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert accounts for their church" ON financial_accounts
    FOR INSERT WITH CHECK (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update accounts from their church" ON financial_accounts
    FOR UPDATE USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete accounts from their church" ON financial_accounts
    FOR DELETE USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

-- 3. Policies for financial_categories
CREATE POLICY "Users can view categories from their church" ON financial_categories
    FOR SELECT USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert categories for their church" ON financial_categories
    FOR INSERT WITH CHECK (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update categories from their church" ON financial_categories
    FOR UPDATE USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete categories from their church" ON financial_categories
    FOR DELETE USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

-- 4. Policies for financial_transactions
CREATE POLICY "Users can view transactions from their church" ON financial_transactions
    FOR SELECT USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert transactions for their church" ON financial_transactions
    FOR INSERT WITH CHECK (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update transactions from their church" ON financial_transactions
    FOR UPDATE USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete transactions from their church" ON financial_transactions
    FOR DELETE USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));
