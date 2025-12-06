-- =====================================================
-- FINANCE MODULE - Seed Default Data
-- Insere categorias e contas padrão para todas as igrejas
-- =====================================================

DO $$ 
DECLARE
    church RECORD;
BEGIN
    FOR church IN SELECT id FROM churches WHERE deleted_at IS NULL LOOP
        
        -- 1. Criar Conta Padrão (Caixa Principal)
        IF NOT EXISTS (SELECT 1 FROM financial_accounts WHERE church_id = church.id) THEN
            INSERT INTO financial_accounts (church_id, name, type, initial_balance, is_active)
            VALUES (church.id, 'Caixa Principal', 'cash', 0, true);
        END IF;

        -- 2. Criar Categorias de Receita
        -- Dízimos
        IF NOT EXISTS (SELECT 1 FROM financial_categories WHERE church_id = church.id AND name = 'Dízimos') THEN
            INSERT INTO financial_categories (church_id, name, type, color, is_system)
            VALUES (church.id, 'Dízimos', 'income', '#16a34a', true); -- Green
        END IF;
        
        -- Ofertas
        IF NOT EXISTS (SELECT 1 FROM financial_categories WHERE church_id = church.id AND name = 'Ofertas') THEN
            INSERT INTO financial_categories (church_id, name, type, color, is_system)
            VALUES (church.id, 'Ofertas', 'income', '#22c55e', true); -- Green Light
        END IF;

        -- 3. Criar Categorias de Despesa
        -- Aluguel
        IF NOT EXISTS (SELECT 1 FROM financial_categories WHERE church_id = church.id AND name = 'Aluguel') THEN
            INSERT INTO financial_categories (church_id, name, type, color, is_system)
            VALUES (church.id, 'Aluguel', 'expense', '#dc2626', false); -- Red
        END IF;

        -- Energia
        IF NOT EXISTS (SELECT 1 FROM financial_categories WHERE church_id = church.id AND name = 'Energia') THEN
            INSERT INTO financial_categories (church_id, name, type, color, is_system)
            VALUES (church.id, 'Energia', 'expense', '#ef4444', false); -- Red Light
        END IF;

        -- Água
        IF NOT EXISTS (SELECT 1 FROM financial_categories WHERE church_id = church.id AND name = 'Água') THEN
            INSERT INTO financial_categories (church_id, name, type, color, is_system)
            VALUES (church.id, 'Água', 'expense', '#3b82f6', false); -- Blue
        END IF;

        -- Manutenção
        IF NOT EXISTS (SELECT 1 FROM financial_categories WHERE church_id = church.id AND name = 'Manutenção') THEN
            INSERT INTO financial_categories (church_id, name, type, color, is_system)
            VALUES (church.id, 'Manutenção', 'expense', '#f59e0b', false); -- Orange
        END IF;

    END LOOP;
END $$;
