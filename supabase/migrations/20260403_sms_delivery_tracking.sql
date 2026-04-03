-- SMS DELIVERY TRACKING (WEBHOOK SUPPORT)
-- Migration to add fine-grained delivery tracking for SMS sent via Edge Functions.

-- 1. Create a table for individual message deliveries
CREATE TABLE IF NOT EXISTS public.sms_deliveries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    history_id UUID NOT NULL REFERENCES public.sms_history(id) ON DELETE CASCADE,
    external_id TEXT UNIQUE, -- The ID provided by TelcoSMS gateway
    phone_number TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'delivered', 'failed', 'undelivered', 'expired'
    error_message TEXT,
    delivered_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add Index for performance on Webhook lookups
CREATE INDEX IF NOT EXISTS idx_sms_deliveries_external_id ON public.sms_deliveries(external_id);

-- 3. RLS Policies for deliveries
ALTER TABLE public.sms_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Churches can view their own deliveries" ON public.sms_deliveries
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.sms_history h
        JOIN public.users u ON u.church_id = h.church_id
        WHERE h.id = sms_deliveries.history_id AND u.id = auth.uid()
    )
);

CREATE POLICY "Superadmin full access to deliveries" ON public.sms_deliveries
FOR ALL USING ( public.is_superuser() ) WITH CHECK ( public.is_superuser() );

-- 4. Enable auditing/updated_at trigger (conceptually)
-- We'll just manage updated_at via Edge Function / Webhook for now to keep it simple.
