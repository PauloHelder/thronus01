-- Function to allow public registration of members via Church Slug
-- This bypasses RLS by using SECURITY DEFINER
CREATE OR REPLACE FUNCTION public_register_member(
    p_slug text,
    p_name text,
    p_phone text DEFAULT NULL,
    p_email text DEFAULT NULL,
    p_birth_date date DEFAULT NULL,
    p_gender text DEFAULT NULL, -- 'Male' or 'Female'
    p_address text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with permissions of the creator (postgres)
SET search_path = public
AS $$
DECLARE
    v_church_id uuid;
    v_member_id uuid;
    v_exists boolean;
BEGIN
    -- 1. Find Church by Slug
    SELECT id INTO v_church_id
    FROM churches
    WHERE slug = p_slug;

    IF v_church_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Igreja não encontrada com este link.'
        );
    END IF;

    -- 2. Check if member already exists (by Phone or Email in this church)
    -- This prevents duplicates
    SELECT EXISTS (
        SELECT 1 FROM members 
        WHERE church_id = v_church_id 
        AND (
            (p_phone IS NOT NULL AND phone = p_phone) OR 
            (p_email IS NOT NULL AND email = p_email)
        )
        AND deleted_at IS NULL
    ) INTO v_exists;

    IF v_exists THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Já existe um membro cadastrado com este telefone ou email.'
        );
    END IF;

    -- 3. Insert Member
    INSERT INTO members (
        church_id,
        name,
        phone,
        email,
        birth_date,
        gender,
        address,
        status, -- Active
        church_role, -- Membro (default)
        created_at
    ) VALUES (
        v_church_id,
        p_name,
        p_phone,
        p_email,
        p_birth_date,
        p_gender,
        p_address,
        'Active',
        'Membro',
        NOW()
    ) RETURNING id INTO v_member_id;

    RETURN jsonb_build_object(
        'success', true,
        'member_id', v_member_id,
        'message', 'Cadastro realizado com sucesso!'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;
