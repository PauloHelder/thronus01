-- Create Enum for SMS transaction types
CREATE TYPE sms_transaction_type AS ENUM ('credit', 'debit', 'bonus');

-- Table: sms_packages
CREATE TABLE IF NOT EXISTS public.sms_packages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    messages_count INTEGER NOT NULL CHECK (messages_count > 0),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: church_sms_balances
CREATE TABLE IF NOT EXISTS public.church_sms_balances (
    church_id UUID PRIMARY KEY REFERENCES public.churches(id) ON DELETE CASCADE,
    available_messages INTEGER NOT NULL DEFAULT 0,
    total_sent INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: sms_transactions
CREATE TABLE IF NOT EXISTS public.sms_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    package_id UUID REFERENCES public.sms_packages(id) ON DELETE SET NULL,
    type sms_transaction_type NOT NULL,
    amount INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Function to handle bonus logic for Profissional/Premium plans
CREATE OR REPLACE FUNCTION assign_plan_sms_bonus()
RETURNS TRIGGER AS $$
DECLARE
    plan_name text;
    bonus_amount integer := 0;
BEGIN
    -- Check what plan name they are subscribing to
    SELECT name INTO plan_name FROM public.plans WHERE id = NEW.plan_id;

    IF plan_name ILIKE '%Profissional%' THEN
        bonus_amount := 50;
    ELSIF plan_name ILIKE '%Premium%' THEN
        bonus_amount := 100;
    END IF;

    -- If a bonus is applicable
    IF bonus_amount > 0 THEN
        -- Safely initialize balance if it does not exist
        INSERT INTO public.church_sms_balances (church_id, available_messages)
        VALUES (NEW.church_id, bonus_amount)
        ON CONFLICT (church_id) 
        DO UPDATE SET available_messages = public.church_sms_balances.available_messages + bonus_amount,
                      updated_at = now();
                      
        -- Insert a transaction log
        INSERT INTO public.sms_transactions (church_id, type, amount, description)
        VALUES (NEW.church_id, 'bonus', bonus_amount, 'Bônus SMS do Plano ' || plan_name);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the logic whenever a new subscription is created (and becomes active)
DROP TRIGGER IF EXISTS trigger_assign_plan_sms_bonus ON public.subscriptions;
CREATE TRIGGER trigger_assign_plan_sms_bonus
AFTER INSERT ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION assign_plan_sms_bonus();

-- Function for Churches to purchase a package directly from Admin Interface
CREATE OR REPLACE FUNCTION admin_credit_sms_package(p_church_id UUID, p_package_id UUID)
RETURNS void AS $$
DECLARE
    pkg_amount integer;
    pkg_name text;
BEGIN
    SELECT messages_count, name INTO pkg_amount, pkg_name FROM public.sms_packages WHERE id = p_package_id;
    IF pkg_amount IS NULL THEN
        RAISE EXCEPTION 'Pacote SMS inválido.';
    END IF;

    -- Update balance
    INSERT INTO public.church_sms_balances (church_id, available_messages)
    VALUES (p_church_id, pkg_amount)
    ON CONFLICT (church_id) 
    DO UPDATE SET available_messages = public.church_sms_balances.available_messages + pkg_amount,
                  updated_at = now();
                  
    -- Add transaction
    INSERT INTO public.sms_transactions (church_id, package_id, type, amount, description)
    VALUES (p_church_id, p_package_id, 'credit', pkg_amount, 'Compra do Pacote: ' || pkg_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE public.sms_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_sms_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_transactions ENABLE ROW LEVEL SECURITY;

-- Superuser validation function to bypass RLS recursion
CREATE OR REPLACE FUNCTION public.is_superuser()
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND (
            role IN ('superuser', 'admin')
            OR permissions::text ILIKE '%superuser%'
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Policies for sms_packages
DROP POLICY IF EXISTS "Public read access to active sms_packages" ON public.sms_packages;
CREATE POLICY "Public read access to active sms_packages" ON public.sms_packages
FOR SELECT USING (true); -- MODIFICADO: Permite que todos os users registados consigam ler os pacotes

DROP POLICY IF EXISTS "Superadmin full access to sms_packages" ON public.sms_packages;
CREATE POLICY "Superadmin full access to sms_packages" ON public.sms_packages
FOR ALL USING ( public.is_superuser() ) WITH CHECK ( public.is_superuser() );

-- Policies for balances
DROP POLICY IF EXISTS "Churches can read their own sms balance" ON public.church_sms_balances;
CREATE POLICY "Churches can read their own sms balance" ON public.church_sms_balances
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() AND users.church_id = church_sms_balances.church_id
    )
);

DROP POLICY IF EXISTS "Superadmin full access to church balances" ON public.church_sms_balances;
CREATE POLICY "Superadmin full access to church balances" ON public.church_sms_balances
FOR ALL USING ( public.is_superuser() ) WITH CHECK ( public.is_superuser() );

-- Policies for transactions
DROP POLICY IF EXISTS "Churches can read their own sms transactions" ON public.sms_transactions;
CREATE POLICY "Churches can read their own sms transactions" ON public.sms_transactions
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() AND users.church_id = sms_transactions.church_id
    )
);

DROP POLICY IF EXISTS "Superadmin full access to sms_transactions" ON public.sms_transactions;
CREATE POLICY "Superadmin full access to sms_transactions" ON public.sms_transactions
FOR ALL USING ( public.is_superuser() ) WITH CHECK ( public.is_superuser() );

-- RPC for fetching sms packages easily
CREATE OR REPLACE FUNCTION get_sms_packages()
RETURNS SETOF public.sms_packages AS $$
BEGIN
    RETURN QUERY SELECT * FROM public.sms_packages ORDER BY price ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deduct balance after SMS sent
CREATE OR REPLACE FUNCTION deduct_sms_balance(p_church_id UUID, p_amount INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE public.church_sms_balances
    SET available_messages = available_messages - p_amount,
        total_sent = total_sent + p_amount,
        updated_at = now()
    WHERE church_id = p_church_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;