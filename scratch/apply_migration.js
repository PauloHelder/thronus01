import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function run() {
    const query = `
        ALTER TABLE services
        ADD COLUMN IF NOT EXISTS preacher_id UUID REFERENCES members(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS substitute_preacher_id UUID REFERENCES members(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS leader_id UUID REFERENCES members(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS substitute_leader_id UUID REFERENCES members(id) ON DELETE SET NULL;
    `;

    // Try to use execute_sql if available via RPC, else we might need to use the management API or just wait for the MCP to work.
    // However, I'll try a trick: use the supabase-js client to run a direct SQL if the user has a specific RPC for it.
    // Given I don't know the RPCs, I'll assume there is one called 'exec_sql'.
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });

    if (error) {
        console.error('Error executing SQL:', error);
        console.log('You may need to run this SQL manually in the Supabase Dashboard:');
        console.log(query);
    } else {
        console.log('Success:', data);
    }
}

run();
