-- Update member code generation to use 6 digits instead of 4
-- e.g. MAC-000001

CREATE OR REPLACE FUNCTION generate_member_code()
RETURNS TRIGGER AS $$
DECLARE
    next_code INTEGER;
    new_code VARCHAR(20);
    c_slug VARCHAR(100);
    prefix VARCHAR(10);
BEGIN
    IF NEW.member_code IS NULL THEN
        -- Get church slug and create a 3-letter prefix
        SELECT UPPER(SUBSTRING(REGEXP_REPLACE(slug, '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 3))
        INTO c_slug
        FROM churches
        WHERE id = NEW.church_id;
        
        prefix := COALESCE(c_slug, 'CH') || '-';

        -- Get the next available code for this church prefix
        -- Using SUBSTRING to extract the numeric part and find the max
        SELECT COALESCE(MAX(CAST(SUBSTRING(member_code FROM LENGTH(prefix) + 1) AS INTEGER)), 0) + 1
        INTO next_code
        FROM members
        WHERE member_code LIKE prefix || '%'
        AND member_code ~ ('^' || prefix || '[0-9]+$');
        
        -- Format as PREFIX-000001 (6 digits minimum)
        new_code := prefix || LPAD(next_code::TEXT, GREATEST(6, LENGTH(next_code::TEXT)), '0');
        NEW.member_code := new_code;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
