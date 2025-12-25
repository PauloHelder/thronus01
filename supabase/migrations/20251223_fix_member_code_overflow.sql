-- Fix member code generation to handle codes > 999 correctly
-- LPAD truncates if the string is longer than length, which caused M1000 -> M100 collision

CREATE OR REPLACE FUNCTION generate_member_code()
RETURNS TRIGGER AS $$
DECLARE
    next_code INTEGER;
    new_code VARCHAR(20);
BEGIN
    IF NEW.member_code IS NULL THEN
        -- Get the next available code for this church
        -- Using the logic that includes deleted members to be safe/consistent with previous fix
        SELECT COALESCE(MAX(CAST(SUBSTRING(member_code FROM 2) AS INTEGER)), 0) + 1
        INTO next_code
        FROM members
        WHERE church_id = NEW.church_id
        AND member_code ~ '^M[0-9]+$';
        
        -- Format as M001, M002, ... M1000+
        -- Use GREATEST to ensure we don't truncate significantly large numbers while keeping 3-digit padding for small ones
        new_code := 'M' || LPAD(next_code::TEXT, GREATEST(3, LENGTH(next_code::TEXT)), '0');
        NEW.member_code := new_code;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
