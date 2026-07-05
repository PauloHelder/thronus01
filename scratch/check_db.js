import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Connecting to:', supabaseUrl);
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing env vars! VITE_SUPABASE_URL:', supabaseUrl, 'VITE_SUPABASE_ANON_KEY:', !!supabaseAnonKey);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    try {
        console.log('Sending select request to churches table...');
        const start = Date.now();
        const { data, error } = await supabase
            .from('churches')
            .select('*')
            .limit(1);
            
        const elapsed = Date.now() - start;
        if (error) {
            console.error('Error querying database:', error);
        } else {
            console.log('Database request succeeded!');
            console.log(`Latency: ${elapsed} ms`);
            console.log('Returned data count:', data ? data.length : 0);
        }
    } catch (e) {
        console.error('Exception occurred:', e);
    }
}

run();
