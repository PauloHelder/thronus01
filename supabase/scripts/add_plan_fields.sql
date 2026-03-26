ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recommended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS highlighted BOOLEAN DEFAULT false; -- For stylistic variations if needed

-- Update existing plans with default descriptions based on names (migration logic)
UPDATE plans SET description = 'Perfeito para começar' WHERE name = 'Free' AND description IS NULL;
UPDATE plans SET description = 'Para igrejas em crescimento' WHERE name = 'Profissional' AND description IS NULL;
UPDATE plans SET description = 'Para grandes igrejas' WHERE name = 'Premium' AND description IS NULL;

-- Set Profissional as popular by default
UPDATE plans SET is_popular = true WHERE name = 'Profissional' AND is_popular IS NULL;
