import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from parent dir
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
    console.log('Testing Discipleship Insert with Service Role...');

    // 1. Get a leader
    const { data: leader, error: lError } = await supabase
        .from('discipleship_leaders')
        .select('id')
        .limit(1)
        .maybeSingle();

    if (lError) {
        console.error('Error fetching leader:', lError);
        return;
    }

    if (!leader) {
        console.log('No leaders found to test with. Please create a leader first.');
        return;
    }

    console.log('Found leader:', leader.id);

    // 2. Try insert meeting
    console.log('Attempting to insert meeting...');
    const { data: meeting, error: mError } = await supabase
        .from('discipleship_meetings')
        .insert({
            leader_id: leader.id,
            date: new Date().toISOString().split('T')[0],
            status: 'Scheduled',
            notes: 'Debug Insert'
        })
        .select()
        .single();

    if (mError) {
        console.error('Error inserting meeting:', mError);
    } else {
        console.log('Success inserting meeting:', meeting);

        // 3. Try insert attendance (if any disciple exists)
        // Need a disciple for this leader
        const { data: rel } = await supabase
            .from('discipleship_relationships')
            .select('disciple_id')
            .eq('leader_id', leader.id)
            .limit(1)
            .maybeSingle();

        if (rel) {
            console.log('Found disciple:', rel.disciple_id);
            const { error: attError } = await supabase
                .from('discipleship_meeting_attendance')
                .insert({
                    meeting_id: meeting.id,
                    disciple_id: rel.disciple_id,
                    present: true
                });

            if (attError) {
                console.error('Error inserting attendance:', attError);
            } else {
                console.log('Success inserting attendance');
            }
        }

        // Cleanup
        console.log('Cleaning up...');
        await supabase.from('discipleship_meetings').delete().eq('id', meeting.id);
    }
}

test();
