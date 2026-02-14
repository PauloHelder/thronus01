-- =====================================================
-- FINANCE REQUESTS - Database Schema
-- =====================================================

CREATE TABLE IF NOT EXISTS financial_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(15, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'paid'
    requested_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    category_id UUID REFERENCES financial_categories(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_finance_requests_church ON financial_requests(church_id);
CREATE INDEX IF NOT EXISTS idx_finance_requests_department ON financial_requests(department_id);
CREATE INDEX IF NOT EXISTS idx_finance_requests_status ON financial_requests(status);

-- Trigger
CREATE OR REPLACE TRIGGER update_financial_requests_modtime
    BEFORE UPDATE ON financial_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE financial_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view requests from their own church"
    ON financial_requests FOR SELECT
    USING (church_id = get_user_church_id());

CREATE POLICY "Users can create requests for their departments"
    ON financial_requests FOR INSERT
    WITH CHECK (church_id = get_user_church_id());

CREATE POLICY "Users can update their own church's requests"
    ON financial_requests FOR UPDATE
    USING (church_id = get_user_church_id());

CREATE POLICY "Users can delete their own church's requests"
    ON financial_requests FOR DELETE
    USING (church_id = get_user_church_id());
