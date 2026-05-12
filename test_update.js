import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    // 1. Fetch a transaction
    const { data: txs, error: fetchError } = await supabase
        .from('financial_transactions')
        .select('*')
        .limit(1);

    if (fetchError || !txs || txs.length === 0) {
        console.error('Fetch error:', fetchError);
        return;
    }

    const tx = txs[0];
    console.log('Fetched tx:', tx.id);

    // 2. Try to update it with typical data from the modal
    const updates = {
        amount: tx.amount,
        date: tx.date,
        category_id: tx.category_id,
        account_id: tx.account_id,
        type: tx.type,
        description: tx.description,
        document_number: tx.document_number,
        notes: tx.notes,
        member_id: tx.member_id || null,
        status: 'paid'
    };

    const { data, error } = await supabase
        .from('financial_transactions')
        .update(updates)
        .eq('id', tx.id);

    if (error) {
        console.error('Update failed with error:', JSON.stringify(error, null, 2));
    } else {
        console.log('Update success');
    }
}

test();
