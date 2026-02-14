-- Função para atualizar o saldo da conta quando uma transação é criada/atualizada/deletada
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Casos de Novo Registro (INSERT)
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.status = 'paid') THEN
            IF (NEW.type = 'income') THEN
                UPDATE financial_accounts
                SET current_balance = current_balance + NEW.amount
                WHERE id = NEW.account_id;
            ELSIF (NEW.type = 'expense') THEN
                UPDATE financial_accounts
                SET current_balance = current_balance - NEW.amount
                WHERE id = NEW.account_id;
            END IF;
        END IF;

    -- 2. Casos de Atualização (UPDATE)
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Se o status mudou para 'paid'
        IF (OLD.status != 'paid' AND NEW.status = 'paid') THEN
            IF (NEW.type = 'income') THEN
                UPDATE financial_accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.account_id;
            ELSIF (NEW.type = 'expense') THEN
                UPDATE financial_accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
            END IF;
        
        -- Se o status mudou de 'paid' para outro
        ELSIF (OLD.status = 'paid' AND NEW.status != 'paid') THEN
            IF (OLD.type = 'income') THEN
                UPDATE financial_accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.account_id;
            ELSIF (OLD.type = 'expense') THEN
                UPDATE financial_accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
            END IF;

        -- Se já estava 'paid' mas mudou o valor ou o tipo ou a conta
        ELSIF (OLD.status = 'paid' AND NEW.status = 'paid') THEN
            -- Reverter transação antiga
            IF (OLD.type = 'income') THEN
                UPDATE financial_accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.account_id;
            ELSIF (OLD.type = 'expense') THEN
                UPDATE financial_accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
            END IF;

            -- Aplicar transação nova
            IF (NEW.type = 'income') THEN
                UPDATE financial_accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.account_id;
            ELSIF (NEW.type = 'expense') THEN
                UPDATE financial_accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
            END IF;
        END IF;

    -- 3. Casos de Exclusão (DELETE ou Soft Delete via deleted_at)
    ELSIF (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL)) THEN
        IF (OLD.status = 'paid') THEN
            IF (OLD.type = 'income') THEN
                UPDATE financial_accounts
                SET current_balance = current_balance - OLD.amount
                WHERE id = OLD.account_id;
            ELSIF (OLD.type = 'expense') THEN
                UPDATE financial_accounts
                SET current_balance = current_balance + OLD.amount
                WHERE id = OLD.account_id;
            END IF;
        END IF;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para a tabela financial_transactions
DROP TRIGGER IF EXISTS trg_update_account_balance ON financial_transactions;
CREATE TRIGGER trg_update_account_balance
AFTER INSERT OR UPDATE OR DELETE ON financial_transactions
FOR EACH ROW
EXECUTE FUNCTION update_account_balance();
