const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ujrthsaahokpsxhvzxqg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqcnRoc2FhaG9rcHN4aHZ6eHFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDYwMjQ1NywiZXhwIjoyMDgwMTc4NDU3fQ.A9O3n3Fzo_txO6iLU92GTiCEfUuZQbWvbWtMJ2ekEaw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    try {
        console.log("Fetching a service...");
        const { data: services, error: fetchError } = await supabase
            .from('services')
            .select('id, theme, stats_teenagers_boys, stats_teenagers_girls')
            .is('deleted_at', null)
            .limit(1);

        if (fetchError || !services || services.length === 0) {
            console.error("No service found to test:", fetchError);
            return;
        }

        const testService = services[0];
        console.log("Original service stats:", testService);

        console.log(`Updating service ${testService.id} with 5 boys and 7 girls...`);
        const { data: updated, error: updateError } = await supabase
            .from('services')
            .update({
                stats_teenagers_boys: 5,
                stats_teenagers_girls: 7
            })
            .eq('id', testService.id)
            .select();

        if (updateError) {
            console.error("Update failed:", updateError);
            return;
        }

        console.log("Updated result returned:", updated[0].stats_teenagers_boys, updated[0].stats_teenagers_girls);

        // Fetch back to verify persistence
        const { data: verified, error: verifyError } = await supabase
            .from('services')
            .select('id, stats_teenagers_boys, stats_teenagers_girls')
            .eq('id', testService.id)
            .single();

        console.log("Verified database value:", verified);
    } catch (e) {
        console.error("Exception:", e);
    }
}

test();
