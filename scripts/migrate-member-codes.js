import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    console.log('Starting member code migration...');
    
    // 1. Fetch all churches
    const { data: churches, error: churchesError } = await supabase
        .from('churches')
        .select('id, slug, name');
        
    if (churchesError || !churches) {
        console.error('Error fetching churches:', churchesError);
        process.exit(1);
    }
    
    console.log(`Loaded ${churches.length} churches.`);
    const churchMap = new Map(churches.map(c => [c.id, c]));
    
    // 2. Fetch all members (ordered by created_at to preserve sequence order)
    const { data: members, error: membersError } = await supabase
        .from('members')
        .select('id, church_id, member_code, created_at')
        .order('created_at', { ascending: true })
        .order('id', { ascending: true });
        
    if (membersError || !members) {
        console.error('Error fetching members:', membersError);
        process.exit(1);
    }
    
    console.log(`Loaded ${members.length} members.`);
    
    // Group members by church and date, then assign sequential numbers
    const dailyCounters = new Map(); // Key: churchId_YYYYMMDD
    let updatedCount = 0;
    
    for (const member of members) {
        const church = churchMap.get(member.church_id);
        if (!church) {
            console.warn(`Warning: Member ${member.id} has invalid church_id ${member.church_id}. Skipping.`);
            continue;
        }
        
        // Compute 3-character prefix
        const cleanSlug = (church.slug || '').replace(/[^a-zA-Z0-9]/g, '').padEnd(3, 'X').toUpperCase();
        const prefix = cleanSlug.substring(0, 3);
        
        // Compute YYYYMMDD date part
        const d = new Date(member.created_at || Date.now());
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        const datePart = `${year}${month}${day}`;
        
        // Get or initialize sequential number counter
        const counterKey = `${member.church_id}_${datePart}`;
        const seq = (dailyCounters.get(counterKey) || 0) + 1;
        dailyCounters.set(counterKey, seq);
        
        // Generate new member code
        const newCode = `${prefix}${datePart}${String(seq).padStart(3, '0')}`;
        
        // Update database row
        console.log(`Updating member ${member.id} code: "${member.member_code || 'null'}" -> "${newCode}"`);
        const { error: updateError } = await supabase
            .from('members')
            .update({ member_code: newCode })
            .eq('id', member.id);
            
        if (updateError) {
            console.error(`Failed to update member ${member.id}:`, updateError);
        } else {
            updatedCount++;
        }
    }
    
    console.log(`Migration finished. Successfully updated ${updatedCount} members.`);
}

migrate().catch(err => {
    console.error('Fatal migration error:', err);
    process.exit(1);
});
