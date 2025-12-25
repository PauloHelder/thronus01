import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    console.error('URL:', supabaseUrl ? 'Found' : 'Missing');
    console.error('Key:', supabaseKey ? 'Found' : 'Missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SUPERUSER_EMAIL = 'tronuslife@gmail.com'; // Corrected typo from gmsil
const SUPERUSER_PASS = 'tronuslife';

async function createSuperUser() {
    console.log(`Creating superuser: ${SUPERUSER_EMAIL}...`);

    // 1. Sign Up
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: SUPERUSER_EMAIL,
        password: SUPERUSER_PASS,
    });

    if (authError) {
        console.error('Error signing up:', authError.message);
        // If user already exists, we might want to just proceed to update role
        if (!authError.message.includes('already registered')) {
            return;
        }
    }

    let userId = authData.user?.id;

    // If sign up failed because user exists, try to sign in
    if (!userId) {
        console.log('User might already exist, trying to sign in...');
        const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
            email: SUPERUSER_EMAIL,
            password: SUPERUSER_PASS
        });

        if (signinError) {
            console.error('Could not sign in:', signinError.message);
            return;
        }
        userId = signinData.user?.id;
    }

    if (!userId) {
        console.error('Could not obtain user ID');
        return;
    }

    console.log(`User ID: ${userId}`);

    // 2. Check if user has a profile/church setup (via complete_signup logic usually)
    // If we just signed up, we might not have a public.users row yet if complete_signup wasn't called.
    // However, I can manually execute the logic or call the RPC if I wanted, but calling RPC requires specific params.
    // Let's try to see if the user exists in public.users

    let { data: userRow } = await supabase.from('users').select('*').eq('id', userId).single();

    if (!userRow) {
        console.log('User row not found in public.users. Creating "Thronus Admin" church...');

        // We need to simulate the complete_signup flow or call it
        const slug = 'thronus-admin-' + Math.floor(Math.random() * 1000);

        const { data: rpcData, error: rpcError } = await supabase.rpc('complete_signup', {
            p_user_id: userId,
            p_email: SUPERUSER_EMAIL,
            p_church_name: 'Thronus Admin System',
            p_church_slug: slug,
            p_phone: '000000000',
            p_address: 'System',
            p_neighborhood: 'System',
            p_district: 'System',
            p_province: 'System',
            p_settings: { categoria: 'System' },
            p_full_name: 'Super Admin'
        });

        if (rpcError) {
            console.error('Error in complete_signup:', rpcError);
            return;
        }

        console.log('Created Thronus Admin church.');
    }

    // 3. Promote to Superuser (using permission flag since role constraint might exist)
    console.log('Promoting to superuser (admin role + superuser permission)...');

    // permissions matches jsonb or array type? In database_diagram it says `permissions` (JSONB likely or array).
    // AuthContext expects an object or array. user.permissions is string[].
    // Let's assume it's an array of strings in the DB or a JSON helper. 
    // Types might need casting.

    const { error: updateError } = await supabase
        .from('users')
        .update({
            role: 'admin',
            permissions: {
                roles: ['superuser'],
                permissions: ['all']
            }
        })
        .eq('id', userId);

    if (updateError) {
        console.error('Error promoting user:', updateError);
    } else {
        console.log('Success! User is now a superuser.');
        console.log(`Email: ${SUPERUSER_EMAIL}`);
        console.log(`Password: ${SUPERUSER_PASS}`);
    }
}

createSuperUser();
