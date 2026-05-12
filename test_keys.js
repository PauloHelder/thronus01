import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const { data: txs, error: fetchError } = await supabase
        .from('financial_transactions')
        .select('*')
        .limit(1);

    if (fetchError || !txs || txs.length === 0) {
        console.error('Fetch error:', fetchError);
        return;
    }

    console.log(Object.keys(txs[0]));
}

test();
