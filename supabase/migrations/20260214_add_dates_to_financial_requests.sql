-- Add approval_date and payment_date to financial_requests table
ALTER TABLE financial_requests 
ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP WITH TIME ZONE DEFAULT NULL;

ALTER TABLE financial_requests 
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Indexing for performance if we filter by these dates later
CREATE INDEX idx_finance_requests_approval_date ON financial_requests(approval_date);
CREATE INDEX idx_finance_requests_payment_date ON financial_requests(payment_date);
