-- =====================================================
-- LIMPEZA TOTAL PARA: mvidaegraca21@gmail.com
-- Apaga tudo (Auth e Banco) para permitir novo cadastro
-- =====================================================

DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Buscar ID do usuário
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'mvidaegraca21@gmail.com';
    
    -- Limpar tabelas públicas (usando email como chave secundária se ID não existir)
    DELETE FROM users WHERE email = 'mvidaegraca21@gmail.com';
    DELETE FROM members WHERE email = 'mvidaegraca21@gmail.com';
    DELETE FROM churches WHERE email = 'mvidaegraca21@gmail.com';
    
    -- Se encontrou usuário no Auth, deleta também
    IF v_user_id IS NOT NULL THEN
        DELETE FROM auth.identities WHERE user_id = v_user_id;
        DELETE FROM auth.users WHERE id = v_user_id;
        RAISE NOTICE '✅ Usuário Auth e dados deletados com sucesso.';
    ELSE
        RAISE NOTICE '⚠️ Usuário não estava no Auth, mas dados públicos foram limpos.';
    END IF;
END $$;
