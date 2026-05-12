-- Add columns to persist the source/destination of a transaction explicitly
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'other';
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS source_id uuid;
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS other_source_name text;

-- Add comment
COMMENT ON COLUMN public.financial_transactions.source_type IS 'Type of the source/destination (member, service, other)';
COMMENT ON COLUMN public.financial_transactions.source_id IS 'UUID reference to member or service depending on source_type';
COMMENT ON COLUMN public.financial_transactions.other_source_name IS 'Custom name if source_type is other';
