
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestChurch() {
    console.log('Creating test church...');

    const churchData = {
        name: 'Igreja Sede Global (Teste)',
        slug: 'SEDE-GLOBAL',
        settings: {
            categoria: 'Sede',
            denominacao: 'Ministério Vida e Graça Global',
            descricao: 'Igreja Sede para testes de vinculação',
            pais: 'Angola',
            provincia: 'Luanda'
        }
    };

    const { data, error } = await supabase
        .from('churches')
        .insert([churchData])
        .select()
        .single();

    if (error) {
        console.error('Error creating church:', error);
    } else {
        console.log('Success! created church:', data.name);
        console.log('Slug (Código de Vinculação):', data.slug);
    }
}

createTestChurch();
