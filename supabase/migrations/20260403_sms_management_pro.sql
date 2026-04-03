-- SMS MANAGEMENT PRO CONSOLIDATION
-- Migration to finalize the SMS purchase flow with status tracking and history auditing.

-- 1. Create Status Enum for Transactions
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sms_transaction_status') THEN
        CREATE TYPE sms_transaction_status AS ENUM ('pending', 'completed', 'rejected');
    END IF;
END $$;

-- 2. Update sms_transactions table
-- Add columns for status and payment proof
ALTER TABLE public.sms_transactions 
ADD COLUMN IF NOT EXISTS status sms_transaction_status DEFAULT 'completed', -- default existing ones to completed
ADD COLUMN IF NOT EXISTS proof_url TEXT;

-- 3. Correct existing data status
UPDATE public.sms_transactions SET status = 'completed' WHERE status IS NULL;

-- 4. Create missing sms_history table (audit for sent messages)
-- Note: This is separate from 'transactions' (credits/debits for money). 
-- This is the actual log of every SMS sent.
CREATE TABLE IF NOT EXISTS public.sms_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    recipient_count INTEGER NOT NULL DEFAULT 1,
    recipients JSONB NOT NULL DEFAULT '[]'::jsonb,
    context_type TEXT, -- 'member_alert', 'event_reminder', etc.
    context_id UUID,
    channel TEXT DEFAULT 'sms',
    status TEXT DEFAULT 'sent', -- 'sent', 'failed'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. RPC: request_sms_purchase
-- Called by churches to start a purchase flow
CREATE OR REPLACE FUNCTION request_sms_purchase(p_package_id UUID, p_proof_url TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
    v_church_id UUID;
    v_amount INTEGER;
    v_pkg_name TEXT;
    v_transaction_id UUID;
BEGIN
    -- Get current user context
    v_church_id := (SELECT church_id FROM public.users WHERE id = auth.uid());
    
    IF v_church_id IS NULL THEN
        RAISE EXCEPTION 'O usuário não está vinculado a uma igreja.';
    END IF;

    -- Get package details
    SELECT messages_count, name INTO v_amount, v_pkg_name 
    FROM public.sms_packages 
    WHERE id = p_package_id AND active = true;

    IF v_amount IS NULL THEN
        RAISE EXCEPTION 'Pacote SMS inválido ou inativo.';
    END IF;

    -- Insert pending transaction
    INSERT INTO public.sms_transactions (
        church_id, 
        package_id, 
        type, 
        amount, 
        description, 
        status, 
        proof_url
    )
    VALUES (
        v_church_id, 
        p_package_id, 
        'credit', 
        v_amount, 
        'Compra de Pacote: ' || v_pkg_name, 
        'pending', 
        p_proof_url
    )
    RETURNING id INTO v_transaction_id;

    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC: approve_sms_purchase (Atomic)
-- Called by Super Admin to confirm payment
CREATE OR REPLACE FUNCTION approve_sms_purchase(p_transaction_id UUID)
RETURNS void AS $$
DECLARE
    v_amount INTEGER;
    v_church_id UUID;
    v_status sms_transaction_status;
BEGIN
    -- Check permissions (must be superuser)
    IF NOT public.is_superuser() THEN
        RAISE EXCEPTION 'Acesso negado: Requer privilégios de Super Admin.';
    END IF;

    -- Get transaction details
    SELECT amount, church_id, status INTO v_amount, v_church_id, v_status 
    FROM public.sms_transactions 
    WHERE id = p_transaction_id;

    IF v_status != 'pending' THEN
        RAISE EXCEPTION 'Esta transação já foi processada (Status: %).', v_status;
    END IF;

    -- 1. Update balance
    INSERT INTO public.church_sms_balances (church_id, available_messages)
    VALUES (v_church_id, v_amount)
    ON CONFLICT (church_id) 
    DO UPDATE SET 
        available_messages = public.church_sms_balances.available_messages + v_amount,
        updated_at = now();

    -- 2. Mark transaction as completed
    UPDATE public.sms_transactions 
    SET status = 'completed', created_at = now() -- Update timestamp to when it was actually credited
    WHERE id = p_transaction_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Add Policies for sms_history
ALTER TABLE public.sms_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Churches can read their own sms history" ON public.sms_history;
CREATE POLICY "Churches can read their own sms history" ON public.sms_history
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() AND users.church_id = sms_history.church_id
    )
);

DROP POLICY IF EXISTS "Superadmin full access to sms history" ON public.sms_history;
CREATE POLICY "Superadmin full access to sms history" ON public.sms_history
FOR ALL USING ( public.is_superuser() ) WITH CHECK ( public.is_superuser() );

-- 8. Storage Bucket for Payment Proofs
-- Create bucket if not exists (requires storage schema access)
-- Note: This might require manual execution depending on permissions
INSERT INTO storage.buckets (id, name, public) 
VALUES ('sms_proofs', 'sms_proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- We use DO blocks to avoid errors if policies already exist when testing
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Authenticated users can upload sms proofs" ON storage.objects;
    CREATE POLICY "Authenticated users can upload sms proofs" 
    ON storage.objects FOR INSERT 
    WITH CHECK (
        bucket_id = 'sms_proofs' AND 
        auth.role() = 'authenticated'
    );

    DROP POLICY IF EXISTS "Users can view their own sms proofs" ON storage.objects;
    CREATE POLICY "Users can view their own sms proofs" 
    ON storage.objects FOR SELECT 
    USING (
        bucket_id = 'sms_proofs' AND 
        (auth.uid() = owner OR public.is_superuser())
    );

    DROP POLICY IF EXISTS "Superadmin can manage all sms proofs" ON storage.objects;
    CREATE POLICY "Superadmin can manage all sms proofs" 
    ON storage.objects FOR ALL 
    USING (
        bucket_id = 'sms_proofs' AND public.is_superuser()
    );
END $$;
