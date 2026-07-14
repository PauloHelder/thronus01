-- 1. Add extended columns to members table
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS nickname VARCHAR(100),
ADD COLUMN IF NOT EXISTS blood_type VARCHAR(10),
ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(100),
ADD COLUMN IF NOT EXISTS spouse_member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS spouse_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS marriage_date DATE,
ADD COLUMN IF NOT EXISTS father_member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS father_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS mother_member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS mother_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS children_data JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS custom_relationships JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS conversion_date DATE,
ADD COLUMN IF NOT EXISTS conversion_church VARCHAR(255),
ADD COLUMN IF NOT EXISTS baptism_church VARCHAR(255),
ADD COLUMN IF NOT EXISTS entry_date DATE,
ADD COLUMN IF NOT EXISTS entry_reason VARCHAR(100),
ADD COLUMN IF NOT EXISTS entry_origin_church VARCHAR(255),
ADD COLUMN IF NOT EXISTS exit_date DATE,
ADD COLUMN IF NOT EXISTS exit_reason VARCHAR(100),
ADD COLUMN IF NOT EXISTS exit_destination_church VARCHAR(255),
ADD COLUMN IF NOT EXISTS transition_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ecclesiastical_titles VARCHAR(255)[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ecclesiastical_functions VARCHAR(255)[] DEFAULT '{}';

-- 2. Update member code generation function to support: [Prefix][YYYYMMDD][Seq]
CREATE OR REPLACE FUNCTION generate_member_code()
RETURNS TRIGGER AS $$
DECLARE
    next_code INTEGER;
    new_code VARCHAR(30);
    c_slug VARCHAR(100);
    prefix VARCHAR(3);
    date_part VARCHAR(8);
BEGIN
    IF NEW.member_code IS NULL THEN
        -- Get church slug and create a 3-letter prefix
        SELECT UPPER(RPAD(REGEXP_REPLACE(slug, '[^a-zA-Z0-9]', '', 'g'), 3, 'X'))
        INTO c_slug
        FROM churches
        WHERE id = NEW.church_id;
        
        prefix := SUBSTRING(c_slug FROM 1 FOR 3);
        date_part := TO_CHAR(COALESCE(NEW.created_at, NOW()), 'YYYYMMDD');

        -- Get the next available code for this prefix and date
        SELECT COALESCE(MAX(CAST(SUBSTRING(member_code FROM 12) AS INTEGER)), 0) + 1
        INTO next_code
        FROM members
        WHERE member_code LIKE prefix || date_part || '%'
        AND LENGTH(member_code) >= 14;
        
        new_code := prefix || date_part || LPAD(next_code::TEXT, 3, '0');
        NEW.member_code := new_code;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Reload config to ensure PostgREST registers the columns
NOTIFY pgrst, 'reload config';
