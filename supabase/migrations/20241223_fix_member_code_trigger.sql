-- Fix member code generation to include deleted members
-- This prevents collision when a member is deleted and a new one is created
-- with what would have been the same code.

CREATE OR REPLACE FUNCTION generate_member_code()
RETURNS TRIGGER AS $$
DECLARE
    next_code INTEGER;
    new_code VARCHAR(20);
BEGIN
    IF NEW.member_code IS NULL THEN
        -- Get the next available code for this church
        -- REMOVED: AND deleted_at IS NULL condition to avoid reusing codes of deleted members
        SELECT COALESCE(MAX(CAST(SUBSTRING(member_code FROM 2) AS INTEGER)), 0) + 1
        INTO next_code
        FROM members
        WHERE church_id = NEW.church_id
        AND member_code ~ '^M[0-9]+$';
        
        -- Format as M001, M002, etc.
        new_code := 'M' || LPAD(next_code::TEXT, 3, '0');
        NEW.member_code := new_code;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
