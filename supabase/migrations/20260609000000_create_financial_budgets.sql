-- =====================================================
-- FINANCE MODULE - BUDGETING
-- Table: financial_budgets
-- =====================================================

-- 1. Create financial_budgets Table
CREATE TABLE IF NOT EXISTS public.financial_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.financial_categories(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_church_category_period UNIQUE (church_id, category_id, year, month)
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_financial_budgets_church ON public.financial_budgets(church_id);
CREATE INDEX IF NOT EXISTS idx_financial_budgets_category ON public.financial_budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_financial_budgets_period ON public.financial_budgets(year, month);

-- 3. Enable RLS
ALTER TABLE public.financial_budgets ENABLE ROW LEVEL SECURITY;

-- 4. Policies for financial_budgets
CREATE POLICY "Users can view budgets from their church" ON public.financial_budgets
    FOR SELECT USING (
        church_id IN (
            SELECT church_id FROM public.user_churches 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can insert budgets for their church" ON public.financial_budgets
    FOR INSERT WITH CHECK (
        church_id IN (
            SELECT church_id FROM public.user_churches 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can update budgets from their church" ON public.financial_budgets
    FOR UPDATE USING (
        church_id IN (
            SELECT church_id FROM public.user_churches 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can delete budgets from their church" ON public.financial_budgets
    FOR DELETE USING (
        church_id IN (
            SELECT church_id FROM public.user_churches 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- 5. Trigger for updated_at
CREATE OR REPLACE TRIGGER update_financial_budgets_modtime
    BEFORE UPDATE ON public.financial_budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
