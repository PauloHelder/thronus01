-- Add BI Number to members table
ALTER TABLE members ADD COLUMN bi_number TEXT;

-- Add comment
COMMENT ON COLUMN members.bi_number IS 'Bilhete de Identidade (Nº de BI)';
