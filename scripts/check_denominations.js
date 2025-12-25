import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Load env vars
// Note: This script assumes .env or .env.local is available or vars are passed.
// We'll try to read from .env.local manually if dotenv doesn't pick it up (often happens in some setups)

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: variables VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not found in environment.');
    console.error('Make sure you have a .env or .env.local file.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Checking denominations table...');

    // 1. Check if table exists (fetched list)
    const { data, error } = await supabase
        .from('denominations')
        .select('*')
        .limit(5);

    if (error) {
        console.error('Error fetching denominations:', error.message);
        if (error.message.includes('relation "denominations" does not exist')) {
            console.error(' >>> TABLE MISSING. You need to run the fix_denominations_schema.sql script in Supabase!');
        } else if (error.code === '42501') {
            console.error(' >>> PERMISSION DENIED. RLS Policies might be broken. Run fix_denominations_schema.sql!');
        }
    } else {
        console.log(`Success! Found ${data.length} records.`);
        if (data.length === 0) {
            console.warn(' >>> TABLE EXISTS BUT IS EMPTY. Run the INSERT part of the script.');
        } else {
            console.log('Sample data:', data);
        }
    }
}

check();
