-- Comprehensive fix for denominations table
-- Run this script in the Supabase SQL Editor to ensure the schema is correct.

-- 1. Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS denominations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add new columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'denominations' AND column_name = 'acronym') THEN
        ALTER TABLE denominations ADD COLUMN acronym TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'denominations' AND column_name = 'doctrinal_current') THEN
        ALTER TABLE denominations ADD COLUMN doctrinal_current TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'denominations' AND column_name = 'max_leader') THEN
        ALTER TABLE denominations ADD COLUMN max_leader TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'denominations' AND column_name = 'recognition_year') THEN
        ALTER TABLE denominations ADD COLUMN recognition_year INTEGER;
    END IF;
END $$;

-- 3. Enable RLS
ALTER TABLE denominations ENABLE ROW LEVEL SECURITY;

-- 4. Re-create policies (Drop first to avoid conflicts)
DROP POLICY IF EXISTS "Public read access for denominations" ON denominations;
DROP POLICY IF EXISTS "Super Admin all access" ON denominations;

-- Policy: Everyone can read (for Signup)
CREATE POLICY "Public read access for denominations" ON denominations
    FOR SELECT
    TO public
    USING (true);

-- Policy: Authenticated users can do everything (Simplified for Admin Dashboard usage)
-- In a strict production env, you might restrict this to specific roles.
CREATE POLICY "Authenticated full access" ON denominations
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 5. Insert initial data if table is empty
INSERT INTO denominations (name)
SELECT name FROM (VALUES
    ('Assembleia Cristã Alfa e Omega de Angola'),
    ('Assembleia Missionaria Cristã de Angola'),
    ('Comunidade das Igrejas do Santo Espirito em África'),
    ('Comunidade Evangélica Batistaa em Angola'),
    ('Comunidade Evangélica de Aliança em Angola'),
    ('Comunidade Islâmica de Angola (CISA)'),
    ('Comunidade Islâmica de Angola (COR)'),
    ('Congregação Cristã Boa Vontade'),
    ('Congregação da Cura e Inspiração Profética'),
    ('Convenção Baptista Nacional'),
    ('Christ Embassy Angola'),
    ('Igreja Assembleia dc Deus'),
    ('Igreja de Amor a Jesus Cristo e Espirito Santo'),
    ('Igreja dos Apóstolos de Jesus Cristo em Angola'),
    ('Igreja dos Apóstolos de Oração e de Salvação Eterna'),
    ('Igreja Reformada em Angola'),
    ('Igreja de Reavivamento de Angola'),
    ('Igreja da Revelação dos Espirito Santos em Angola'),
    ('Religião Mpadismo'),
    ('Igreja de Senhor Jesus Cristo Renovada Com a Lei do Espirito Santo'),
    ('Igreja do Templo Água Viva para todas as Nações'),
    ('Igreja Trono de Deus em Angola'),
    ('Igreja União da Promessa dos Profetas'),
    ('Igreja União dos Profetas Africanos'),
    ('Igreja Unida em Angola'),
    ('Igreja Universal dos Espirito Santo Deus dos Nossos Antepassados'),
    ('Igreja Zintumua Za Bangunza Mua Felica'),
    ('Missão Profética Unida em Angola'),
    ('Missão Evangélica de Ensinamentos, Libertação e Adoração'),
    ('Ministério da Vida Cristã Aprofundada'),
    ('União dos Santos Africanos no Mundo')
) as v(name)
WHERE NOT EXISTS (SELECT 1 FROM denominations);
