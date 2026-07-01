-- Migration to link financial_requests with financial_payable_installments
-- Run this in the Supabase SQL Editor

ALTER TABLE financial_requests 
ADD COLUMN IF NOT EXISTS payable_installment_id UUID REFERENCES financial_payable_installments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_finance_requests_payable_installment ON financial_requests(payable_installment_id);
