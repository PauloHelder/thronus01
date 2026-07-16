-- Migration: Create Global Locations (Countries, Provinces, Municipalities)
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
('bengo', 'Bengo', 'AO'),
('benguela', 'Benguela', 'AO'),
('bie', 'Bié', 'AO'),
('cabinda', 'Cabinda', 'AO'),
('cuando-cubango', 'Cuando Cubango', 'AO'),
('cuanza-norte', 'Cuanza Norte', 'AO'),
('cuanza-sul', 'Cuanza Sul', 'AO'),
('cunene', 'Cunene', 'AO'),
('huambo', 'Huambo', 'AO'),
('huila', 'Huíla', 'AO'),
('luanda', 'Luanda', 'AO'),
('lunda-norte', 'Lunda Norte', 'AO'),
('lunda-sul', 'Lunda Sul', 'AO'),
('malanje', 'Malanje', 'AO'),
('moxico', 'Moxico', 'AO'),
('namibe', 'Namibe', 'AO'),
('uige', 'Uíge', 'AO'),
('zaire', 'Zaire', 'AO')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, country_id = EXCLUDED.country_id;

-- Insert Municipalities
INSERT INTO public.municipalities (id, name, province_id) VALUES
('luanda-belas', 'Belas', 'luanda'),
('luanda-cacuaco', 'Cacuaco', 'luanda'),
('luanda-cazenga', 'Cazenga', 'luanda'),
('luanda-icolo-bengo', 'Ícolo e Bengo', 'luanda'),
('luanda-luanda', 'Luanda', 'luanda'),
('luanda-quicama', 'Quiçama', 'luanda'),
('luanda-talatona', 'Talatona', 'luanda'),
('luanda-viana', 'Viana', 'luanda'),
('luanda-kilamba-kiaxi', 'Kilamba Kiaxi', 'luanda'),
('bengo-ambriz', 'Ambriz', 'bengo'),
('bengo-bula-atumba', 'Bula Atumba', 'bengo'),
('bengo-dande', 'Dande', 'bengo'),
('bengo-dembos', 'Dembos', 'bengo'),
('bengo-nambuangongo', 'Nambuangongo', 'bengo'),
('bengo-pango-aluquem', 'Pango Aluquem', 'bengo'),
('benguela-balombo', 'Balombo', 'benguela'),
('benguela-baia-farta', 'Baía Farta', 'benguela'),
('benguela-benguela', 'Benguela', 'benguela'),
('benguela-bocoio', 'Bocoio', 'benguela'),
('benguela-caimbambo', 'Caimbambo', 'benguela'),
('benguela-catumbela', 'Catumbela', 'benguela'),
('benguela-chongoroi', 'Chongorói', 'benguela'),
('benguela-cubal', 'Cubal', 'benguela'),
('benguela-ganda', 'Ganda', 'benguela'),
('benguela-lobito', 'Lobito', 'benguela'),
('huambo-bailundo', 'Bailundo', 'huambo'),
('huambo-cachiungo', 'Cachiungo', 'huambo'),
('huambo-caala', 'Caála', 'huambo'),
('huambo-ecunha', 'Ekunha', 'huambo'),
('huambo-huambo', 'Huambo', 'huambo'),
('huambo-londuimbali', 'Londuimbali', 'huambo'),
('huambo-longonjo', 'Longonjo', 'huambo'),
('huambo-mungo', 'Mungo', 'huambo'),
('huambo-chicala-choloanga', 'Chicala-Choloanga', 'huambo'),
('huambo-chinjenje', 'Chinjenje', 'huambo'),
('huambo-ucuma', 'Ucuma', 'huambo'),
('huila-caconda', 'Caconda', 'huila'),
('huila-cacula', 'Cacula', 'huila'),
('huila-caluquembe', 'Caluquembe', 'huila'),
('huila-chiange', 'Chiange', 'huila'),
('huila-chibia', 'Chibia', 'huila'),
('huila-chicomba', 'Chicomba', 'huila'),
('huila-chipindo', 'Chipindo', 'huila'),
('huila-cuvango', 'Cuvango', 'huila'),
('huila-humpata', 'Humpata', 'huila'),
('huila-jamba', 'Jamba', 'huila'),
('huila-lubango', 'Lubango', 'huila'),
('huila-matala', 'Matala', 'huila'),
('huila-quilengues', 'Quilengues', 'huila'),
('huila-quipungo', 'Quipungo', 'huila'),
('bie-andulo', 'Andulo', 'bie'),
('bie-camacupa', 'Camacupa', 'bie'),
('bie-catabola', 'Catabola', 'bie'),
('bie-chinguar', 'Chinguar', 'bie'),
('bie-chitembo', 'Chitembo', 'bie'),
('bie-cuemba', 'Cuemba', 'bie'),
('bie-cunhinga', 'Cunhinga', 'bie'),
('bie-cuito', 'Cuito', 'bie'),
('bie-nharea', 'Nharea', 'bie'),
('cabinda-belize', 'Belize', 'cabinda'),
('cabinda-buco-zau', 'Buco-Zau', 'cabinda'),
('cabinda-cabinda', 'Cabinda', 'cabinda'),
('cabinda-cacongo', 'Cacongo', 'cabinda'),
('cuando-cubango-calai', 'Calai', 'cuando-cubango'),
('cuando-cubango-cuangar', 'Cuangar', 'cuando-cubango'),
('cuando-cubango-cuchi', 'Cuchi', 'cuando-cubango'),
('cuando-cubango-cuito-cuanavale', 'Cuito Cuanavale', 'cuando-cubango'),
('cuando-cubango-dirico', 'Dirico', 'cuando-cubango'),
('cuando-cubango-mavinga', 'Mavinga', 'cuando-cubango'),
('cuando-cubango-menongue', 'Menongue', 'cuando-cubango'),
('cuando-cubango-nankova', 'Nankova', 'cuando-cubango'),
('cuando-cubango-rivungo', 'Rivungo', 'cuando-cubango'),
('cuanza-norte-ambaca', 'Ambaca', 'cuanza-norte'),
('cuanza-norte-banga', 'Banga', 'cuanza-norte'),
('cuanza-norte-bolongongo', 'Bolongongo', 'cuanza-norte'),
('cuanza-norte-cambambe', 'Cambambe', 'cuanza-norte'),
('cuanza-norte-cazengo', 'Cazengo', 'cuanza-norte'),
('cuanza-norte-golungo-alto', 'Golungo Alto', 'cuanza-norte'),
('cuanza-norte-gonguembo', 'Gonguembo', 'cuanza-norte'),
('cuanza-norte-lucala', 'Lucala', 'cuanza-norte'),
('cuanza-norte-quiculungo', 'Quiculungo', 'cuanza-norte'),
('cuanza-norte-samba-caju', 'Samba Caju', 'cuanza-norte'),
('cuanza-sul-amboim', 'Amboim', 'cuanza-sul'),
('cuanza-sul-cassongue', 'Cassongue', 'cuanza-sul'),
('cuanza-sul-cela', 'Cela', 'cuanza-sul'),
('cuanza-sul-conda', 'Conda', 'cuanza-sul'),
('cuanza-sul-ebo', 'Ebo', 'cuanza-sul'),
('cuanza-sul-libolo', 'Libolo', 'cuanza-sul'),
('cuanza-sul-mussende', 'Mussende', 'cuanza-sul'),
('cuanza-sul-porto-amboim', 'Porto Amboim', 'cuanza-sul'),
('cuanza-sul-quibala', 'Quibala', 'cuanza-sul'),
('cuanza-sul-quilenda', 'Quilenda', 'cuanza-sul'),
('cuanza-sul-seles', 'Seles', 'cuanza-sul'),
('cuanza-sul-sumbe', 'Sumbe', 'cuanza-sul'),
('cunene-cahama', 'Cahama', 'cunene'),
('cunene-cuanhama', 'Cuanhama', 'cunene'),
('cunene-curoca', 'Curoca', 'cunene'),
('cunene-cuvelai', 'Cuvelai', 'cunene'),
('cunene-namacunde', 'Namacunde', 'cunene'),
('cunene-ombadja', 'Ombadja', 'cunene'),
('lunda-norte-cambulo', 'Cambulo', 'lunda-norte'),
('lunda-norte-capenda-camulemba', 'Capenda-Camulemba', 'lunda-norte'),
('lunda-norte-caungula', 'Caungula', 'lunda-norte'),
('lunda-norte-chitato', 'Chitato', 'lunda-norte'),
('lunda-norte-cuango', 'Cuango', 'lunda-norte'),
('lunda-norte-cuilo', 'Cuílo', 'lunda-norte'),
('lunda-norte-lubalo', 'Lubalo', 'lunda-norte'),
('lunda-norte-lucapa', 'Lucapa', 'lunda-norte'),
('lunda-norte-xaxau', 'Xá-Muteba', 'lunda-norte'),
('lunda-sul-cacolo', 'Cacolo', 'lunda-sul'),
('lunda-sul-dala', 'Dala', 'lunda-sul'),
('lunda-sul-muconda', 'Muconda', 'lunda-sul'),
('lunda-sul-saurimo', 'Saurimo', 'lunda-sul'),
('malanje-cacuso', 'Cacuso', 'malanje'),
('malanje-calandula', 'Calandula', 'malanje'),
('malanje-cambundi-catembo', 'Cambundi-Catembo', 'malanje'),
('malanje-cangandala', 'Cangandala', 'malanje'),
('malanje-caombo', 'Caombo', 'malanje'),
('malanje-cuaba-nzogo', 'Cuaba Nzogo', 'malanje'),
('malanje-cunda-dia-baze', 'Cunda-Dia-Baze', 'malanje'),
('malanje-luquembo', 'Luquembo', 'malanje'),
('malanje-malanje', 'Malanje', 'malanje'),
('malanje-massango', 'Massango', 'malanje'),
('malanje-mucari', 'Mucari', 'malanje'),
('malanje-quela', 'Quela', 'malanje'),
('malanje-quirima', 'Quirima', 'malanje'),
('moxico-alto-zambeze', 'Alto Zambeze', 'moxico'),
('moxico-bundas', 'Bundas', 'moxico'),
('moxico-camanongue', 'Camanongue', 'moxico'),
('moxico-cameia', 'Cameia', 'moxico'),
('moxico-luau', 'Luau', 'moxico'),
('moxico-luacano', 'Luacano', 'moxico'),
('moxico-luchazes', 'Luchazes', 'moxico'),
('moxico-luena', 'Luena', 'moxico'),
('moxico-moxico', 'Moxico', 'moxico'),
('namibe-bibala', 'Bibala', 'namibe'),
('namibe-camucuio', 'Camucuio', 'namibe'),
('namibe-mocamedes', 'Moçâmedes', 'namibe'),
('namibe-tompua', 'Tômbua', 'namibe'),
('namibe-virei', 'Virei', 'namibe'),
('uige-alto-cauale', 'Alto Cauale', 'uige'),
('uige-ambuila', 'Ambuíla', 'uige'),
('uige-bembe', 'Bembe', 'uige'),
('uige-buengas', 'Buengas', 'uige'),
('uige-bungo', 'Bungo', 'uige'),
('uige-damba', 'Damba', 'uige'),
('uige-maquela-zombo', 'Maquela do Zombo', 'uige'),
('uige-milunga', 'Milunga', 'uige'),
('uige-mucaba', 'Mucaba', 'uige'),
('uige-negage', 'Negage', 'uige'),
('uige-puri', 'Puri', 'uige'),
('uige-quimbele', 'Quimbele', 'uige'),
('uige-quitexe', 'Quitexe', 'uige'),
('uige-sanza-pombo', 'Sanza Pombo', 'uige'),
('uige-songo', 'Songo', 'uige'),
('uige-uige', 'Uíge', 'uige'),
('zaire-cuimba', 'Cuimba', 'zaire'),
('zaire-mbanza-congo', 'Mbanza Congo', 'zaire'),
('zaire-noqui', 'Nóqui', 'zaire'),
('zaire-nzeto', 'Nzeto', 'zaire'),
('zaire-soio', 'Soio', 'zaire'),
('zaire-tomboco', 'Tomboco', 'zaire')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, province_id = EXCLUDED.province_id;


-- 5. Force reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
