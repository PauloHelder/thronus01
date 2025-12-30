-- 1. Ensure columns exist
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recommended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS highlighted BOOLEAN DEFAULT false;

-- 2. Enable RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- 3. Allow public read access
DROP POLICY IF EXISTS "Plans are viewable by everyone" ON plans;
CREATE POLICY "Plans are viewable by everyone" ON plans FOR SELECT USING (true);

-- 4. Insert Plans if they don't exist
-- Free Plan
INSERT INTO plans (name, price, billing_period, is_active, description, is_popular, features)
SELECT 'Free', 0, 'monthly', true, 'Perfeito para começar', false, 
'{
    "canLinkToSupervision": false,
    "canBeLinked": 0,
    "customBranding": false,
    "maxMembers": 50,
    "maxGroups": 3,
    "serviceStatistics": true,
    "exportStatistics": false,
    "exportFinances": false,
    "maxLeaders": 5,
    "maxDisciples": 0,
    "maxDepartments": 2,
    "maxClasses": 1,
    "maxEvents": 5
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Free');

-- Professional Plan
INSERT INTO plans (name, price, billing_period, is_active, description, is_popular, features)
SELECT 'Profissional', 15000, 'monthly', true, 'Para igrejas em crescimento', true, 
'{
    "canLinkToSupervision": true,
    "canBeLinked": 1,
    "customBranding": true,
    "maxMembers": 500,
    "maxGroups": 20,
    "serviceStatistics": true,
    "exportStatistics": true,
    "exportFinances": true,
    "maxLeaders": 50,
    "maxDisciples": 100,
    "maxDepartments": 10,
    "maxClasses": 10,
    "maxEvents": 20
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Profissional');

-- Premium Plan
INSERT INTO plans (name, price, billing_period, is_active, description, is_popular, features)
SELECT 'Premium', 30000, 'monthly', true, 'Para grandes igrejas', false, 
'{
    "canLinkToSupervision": true,
    "canBeLinked": "unlimited",
    "customBranding": true,
    "maxMembers": "unlimited",
    "maxGroups": "unlimited",
    "serviceStatistics": true,
    "exportStatistics": true,
    "exportFinances": true,
    "maxLeaders": "unlimited",
    "maxDisciples": "unlimited",
    "maxDepartments": "unlimited",
    "maxClasses": "unlimited",
    "maxEvents": 1000
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Premium');

-- 5. Update existing records if they were missing these fields (e.g. if they existed before this script)
UPDATE plans SET description = 'Perfeito para começar' WHERE name = 'Free' AND (description IS NULL OR description = '');
UPDATE plans SET description = 'Para igrejas em crescimento' WHERE name = 'Profissional' AND (description IS NULL OR description = '');
UPDATE plans SET description = 'Para grandes igrejas' WHERE name = 'Premium' AND (description IS NULL OR description = '');
UPDATE plans SET is_popular = true WHERE name = 'Profissional';
