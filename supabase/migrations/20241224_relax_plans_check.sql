-- Relax constraints on plans table to allow dynamic plan management

ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_name_check;

-- Also drop billing period check if we want full flexibility, or keep it if the UI only offers specific options.
-- The UI currently offers 'monthly', 'quarterly', 'semiannual', 'annual'.
-- The original constraint was: CHECK (billing_period IN ('monthly', 'quarterly', 'semiannual', 'annual'))
-- This matches the UI, so we can keep it. But let's check if there are other constraints.
