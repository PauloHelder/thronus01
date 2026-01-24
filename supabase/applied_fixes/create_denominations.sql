-- Create denominations table
CREATE TABLE IF NOT EXISTS denominations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE denominations ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- Allow public read access (for signup page)
CREATE POLICY "Public read access for denominations" ON denominations
    FOR SELECT
    TO public
    USING (true);

-- Allow full access for Super Admin
-- Note: Adjust the role check based on your specific Super Admin implementation. 
-- Assuming checking for a specific role in a profiles table or similar, 
-- implies we trust the client-side role check or have a custom claim.
-- For now, we'll allow authenticated users to read, and restrict write to service_role or specific admin check if possible.
-- Since the requirement is "Visible only for Super Admin" (for management), but SignupPage needs to see it.
-- We'll allow public Select.
-- We'll allow authenticated users with role 'super_admin' to ALL.
-- But since I don't know the exact auth implementation for 'super_admin' in the database (usually in public.users or profiles),
-- I will create a policy that might need adjustment.
-- A common pattern:
-- CREATE POLICY "Super Admin full access" ON denominations
-- FOR ALL
-- TO authenticated
-- USING (auth.jwt() ->> 'role' = 'service_role' OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Simpler policy for now allowing all authenticated users to READ, but only specific ones to WRITE?
-- Actually, the request says "visible only for Super Admin" but implies the CRUD is for Super Admin. 
-- SignupPage needs to list them, so SELECT must be public/anon.
CREATE POLICY "Super Admin all access" ON denominations
    FOR ALL
    USING (
        -- Replace with your actual super admin check
        -- For example, checking a 'profiles' table or metadata
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin') 
        OR 
        (SELECT role FROM profiles WHERE id = auth.uid() limit 1) = 'super_admin' 
        -- Fallback if profiles not set up this way, maybe just allow service role?
    );

-- Insert initial data
INSERT INTO denominations (name) VALUES
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
ON CONFLICT (name) DO NOTHING;
