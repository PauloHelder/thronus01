import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log('---------------------------------------------------');
console.log('🔍 THRONUS DATABASE DIAGNOSTIC TOOL');
console.log('---------------------------------------------------');

if (!supabaseUrl) {
  console.log('❌ FATAL: VITE_SUPABASE_URL not found in .env');
  process.exit(1);
}
if (!supabaseKey) {
  console.log('❌ FATAL: No API KEY found (VITE_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}

console.log(`📍 Connecting to: ${supabaseUrl}`);
console.log(`🔑 Using Key Type: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE (Admin)' : 'ANON (Public)'}`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHealth() {
  try {
    // 1. Check Connectivity & Church Count (using Service Role should bypass RLS)
    console.log('\n[1] Testing Connection & Tables...');
    
    const tablesToCheck = ['churches', 'users', 'members', 'groups', 'financial_transactions'];
    
    for (const table of tablesToCheck) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
            
        if (error) {
            console.log(`   ❌ ${table.padEnd(20)}: Error ${error.code} - ${error.message}`);
        } else {
            console.log(`   ✅ ${table.padEnd(20)}: Functional (Count: ${count})`);
        }
    }

    // 2. Check Specific Fixes (Network/Schema issues mentioned earlier)
    console.log('\n[2] Checking Critical Data...');
    
    // Check if any Super Admin exists
    const { data: admins, error: adminError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('role', 'super_admin');
        
    if (adminError) {
         console.log(`   ⚠️ Could not query users table for super_admin: ${adminError.message}`);
    } else {
         console.log(`   ℹ️ Super Admins found: ${admins.length}`);
    }

    console.log('\n---------------------------------------------------');
    console.log('✅ DIAGNOSIS FINISHED');
    console.log('---------------------------------------------------');

  } catch (err) {
    console.log('❌ Unexpected Script Error:', err);
  }
}

checkHealth();
