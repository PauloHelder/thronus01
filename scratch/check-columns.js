import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('=== Checking database columns ===');
    const { data, error } = await supabase
        .from('members')
        .select('id, name, member_code, baptism_church')
        .limit(1);

    if (error) {
        console.error('Error fetching members column:', error.message);
        console.error('Full Error:', JSON.stringify(error, null, 2));
    } else {
        console.log('Success! Columns exist in schema. Fetched record:', data);
    }
}

check();
