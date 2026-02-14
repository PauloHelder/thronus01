DO $$ 
DECLARE 
    r RECORD;
    v_balance DECIMAL;
BEGIN
    FOR r IN SELECT id, initial_balance FROM financial_accounts LOOP
        v_balance := r.initial_balance;
        
        -- Somar receitas pagas e ativas
        v_balance := v_balance + COALESCE((
            SELECT SUM(amount) 
            FROM financial_transactions 
            WHERE account_id = r.id 
            AND type = 'income' 
            AND status = 'paid'
            AND deleted_at IS NULL
        ), 0);
        
        -- Subtrair despesas pagas e ativas
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
