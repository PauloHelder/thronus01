-- Fix the trigger function to handle soft deletes correctly
CREATE OR REPLACE FUNCTION public.update_account_balance()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- 1. Cases: INSERT
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.status = 'paid' AND NEW.deleted_at IS NULL) THEN
            IF (NEW.type = 'income') THEN
                UPDATE financial_accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.account_id;
            ELSIF (NEW.type = 'expense') THEN
                UPDATE financial_accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
            END IF;
        END IF;

    -- 2. Cases: UPDATE
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Case A: Soft Delete (Transition from NULL to NOT NULL)
        IF (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) THEN
            IF (OLD.status = 'paid') THEN
                IF (OLD.type = 'income') THEN
                    UPDATE financial_accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.account_id;
                ELSIF (OLD.type = 'expense') THEN
                    UPDATE financial_accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
                END IF;
            END IF;
        
        -- Case B: Restore (Transition from NOT NULL to NULL)
        ELSIF (OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) THEN
            IF (NEW.status = 'paid') THEN
                IF (NEW.type = 'income') THEN
                    UPDATE financial_accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.account_id;
                ELSIF (NEW.type = 'expense') THEN
                    UPDATE financial_accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
                END IF;
            END IF;

        -- Case C: Normal Update (Transaction is and remains active)
        ELSIF (NEW.deleted_at IS NULL) THEN
            -- Status changed to 'paid'
            IF (OLD.status != 'paid' AND NEW.status = 'paid') THEN
                IF (NEW.type = 'income') THEN
                    UPDATE financial_accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.account_id;
                ELSIF (NEW.type = 'expense') THEN
                    UPDATE financial_accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
                END IF;
            
            -- Status changed from 'paid' to something else
            ELSIF (OLD.status = 'paid' AND NEW.status != 'paid') THEN
                IF (OLD.type = 'income') THEN
                    UPDATE financial_accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.account_id;
                ELSIF (OLD.type = 'expense') THEN
                    UPDATE financial_accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
                END IF;

            -- Value, type, or account changed while remaining 'paid'
            ELSIF (OLD.status = 'paid' AND NEW.status = 'paid') THEN
                -- Revert old values
                IF (OLD.type = 'income') THEN
                    UPDATE financial_accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.account_id;
                ELSIF (OLD.type = 'expense') THEN
                    UPDATE financial_accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
                END IF;

                -- Apply new values
                IF (NEW.type = 'income') THEN
                    UPDATE financial_accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.account_id;
                ELSIF (NEW.type = 'expense') THEN
                    UPDATE financial_accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
                END IF;
            END IF;
        END IF;

    -- 3. Cases: Physical DELETE
    ELSIF (TG_OP = 'DELETE') THEN
        IF (OLD.status = 'paid' AND OLD.deleted_at IS NULL) THEN
            IF (OLD.type = 'income') THEN
                UPDATE financial_accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.account_id;
            ELSIF (OLD.type = 'expense') THEN
                UPDATE financial_accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
            END IF;
        END IF;
    END IF;

    RETURN NULL;
END;
$function$;

-- RECALCULATE ALL BALANCES TO FIX DISCREPANCIES
DO $$ 
DECLARE 
    r RECORD;
    v_balance DECIMAL;
BEGIN
    FOR r IN SELECT id, initial_balance FROM financial_accounts LOOP
        v_balance := COALESCE(r.initial_balance, 0);
        
        -- Add paid income
        v_balance := v_balance + COALESCE((
            SELECT SUM(amount) 
            FROM financial_transactions 
            WHERE account_id = r.id 
            AND type = 'income' 
            AND status = 'paid'
            AND deleted_at IS NULL
        ), 0);
        
        -- Subtract paid expenses
        v_balance := v_balance - COALESCE((
            SELECT SUM(amount) 
            FROM financial_transactions 
            WHERE account_id = r.id 
            AND type = 'expense' 
            AND status = 'paid'
            AND deleted_at IS NULL
        ), 0);
        
        UPDATE financial_accounts 
        SET current_balance = v_balance 
        WHERE id = r.id;
    END LOOP;
END $$;
