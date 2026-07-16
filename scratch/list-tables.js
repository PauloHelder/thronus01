import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function list() {
    const { data, error } = await supabase.rpc('get_admin_dashboard_data').maybeSingle();
    // Alternatively, just query pg_tables or information_schema via a select, but PostgREST doesn't expose information_schema by default.
    // Let's test if we can select from 'provinces' directly.
    console.log('Testing if provinces table exists...');
    const { data: prov, error: provError } = await supabase.from('provinces').select('id').limit(1);
    if (provError) {
        console.log('Provinces table does not exist:', provError.message);
    } else {
        console.log('Provinces table exists!');
    }

    console.log('Testing if municipalities table exists...');
    const { data: mun, error: munError } = await supabase.from('municipalities').select('id').limit(1);
    if (munError) {
        console.log('Municipalities table does not exist:', munError.message);
    } else {
        console.log('Municipalities table exists!');
    }
}

list();
