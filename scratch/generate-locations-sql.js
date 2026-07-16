import fs from 'fs';

// Wait, let's look at the imports. Since angolaLocations.ts is TypeScript, we can just read the file as text and extract it, or since we are running Node, let's write a simple script that reads the file content as text, compiles it slightly, or we can just import from the compiled JS if it exists, or just read it directly!
// Wait! Let's write a robust parser that parses angolaLocations.ts or we can just read it and format it.
// Actually, let's read the file and parse it. It's a typescript file.
// Or we can just import it! Let's see if we can import it. The project type is "module", so we can import it if it's JS. But it's TS.
// Let's write a script that reads the file, extracts the arrays using regex, and parses them using JSON5 or similar, or just parse line by line!
// Line by line parsing is very easy:
// For provinces: { id: 'bengo', name: 'Bengo' } -> ('bengo', 'Bengo', 'AO')
// For municipalities: { id: 'luanda-belas', name: 'Belas', provinceId: 'luanda' } -> ('luanda-belas', 'Belas', 'luanda')

const content = fs.readFileSync('src/data/angolaLocations.ts', 'utf8');

const provinceMatches = content.match(/\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)'\s*\}/g) || [];
const provinces = provinceMatches.map(m => {
    const id = m.match(/id:\s*'([^']+)'/)[1];
    const name = m.match(/name:\s*'([^']+)'/)[1];
    return { id, name };
});

const municipalityMatches = content.match(/\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*provinceId:\s*'([^']+)'\s*\}/g) || [];
const municipalities = municipalityMatches.map(m => {
    const id = m.match(/id:\s*'([^']+)'/)[1];
    const name = m.match(/name:\s*'([^']+)'/)[1];
    const provinceId = m.match(/provinceId:\s*'([^']+)'/)[1];
    return { id, name, provinceId };
});

console.log(`Parsed ${provinces.length} provinces and ${municipalities.length} municipalities.`);

let sql = `-- Migration: Create Global Locations (Countries, Provinces, Municipalities)
-- Generated on 2026-07-15

-- 1. Create Tables
CREATE TABLE IF NOT EXISTS public.countries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.provinces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    country_id TEXT NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (name, country_id)
);

CREATE TABLE IF NOT EXISTS public.municipalities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    province_id TEXT NOT NULL REFERENCES public.provinces(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (name, province_id)
);

-- 2. Enable RLS
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.municipalities ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Allow public select for authenticated users
CREATE POLICY public_select_countries ON public.countries FOR SELECT TO authenticated USING (true);
CREATE POLICY public_select_provinces ON public.provinces FOR SELECT TO authenticated USING (true);
CREATE POLICY public_select_municipalities ON public.municipalities FOR SELECT TO authenticated USING (true);

-- Allow all operations for superuser account (email = 'tronuslife@gmail.com')
CREATE POLICY superuser_all_countries ON public.countries FOR ALL TO authenticated 
    USING (auth.jwt() ->> 'email' = 'tronuslife@gmail.com')
    WITH CHECK (auth.jwt() ->> 'email' = 'tronuslife@gmail.com');

CREATE POLICY superuser_all_provinces ON public.provinces FOR ALL TO authenticated 
    USING (auth.jwt() ->> 'email' = 'tronuslife@gmail.com')
    WITH CHECK (auth.jwt() ->> 'email' = 'tronuslife@gmail.com');

CREATE POLICY superuser_all_municipalities ON public.municipalities FOR ALL TO authenticated 
    USING (auth.jwt() ->> 'email' = 'tronuslife@gmail.com')
    WITH CHECK (auth.jwt() ->> 'email' = 'tronuslife@gmail.com');

-- 4. Seed Data
-- Insert Country
INSERT INTO public.countries (id, name) VALUES ('AO', 'Angola') ON CONFLICT (id) DO NOTHING;

-- Insert Provinces
INSERT INTO public.provinces (id, name, country_id) VALUES
`;

sql += provinces.map(p => `('${p.id}', '${p.name.replace(/'/g, "''")}', 'AO')`).join(',\n') + '\nON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, country_id = EXCLUDED.country_id;\n\n';

sql += '-- Insert Municipalities\nINSERT INTO public.municipalities (id, name, province_id) VALUES\n';
sql += municipalities.map(m => `('${m.id}', '${m.name.replace(/'/g, "''")}', '${m.provinceId}')`).join(',\n') + '\nON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, province_id = EXCLUDED.province_id;\n\n';

sql += `
-- 5. Force reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
`;

fs.writeFileSync('supabase/migrations/20260715_create_locations_schema.sql', sql);
console.log('SQL Migration generated successfully in supabase/migrations/20260715_create_locations_schema.sql');
