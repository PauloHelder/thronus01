const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ujrthsaahokpsxhvzxqg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqcnRoc2FhaG9rcHN4aHZ6eHFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDYwMjQ1NywiZXhwIjoyMDgwMTc4NDU3fQ.A9O3n3Fzo_txO6iLU92GTiCEfUuZQbWvbWtMJ2ekEaw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    try {
        console.log("Fetching 5 most recently updated services...");
        const { data: services, error } = await supabase
            .from('services')
            .select('id, updated_at, stats_adults_men, stats_adults_women, stats_teenagers_boys, stats_teenagers_girls, status')
            .order('updated_at', { ascending: false })
            .limit(5);

        if (error) {
            console.error("Error:", error);
            return;
        }

        console.log("Recent services:");
        services.forEach(s => {
            console.log(`ID: ${s.id}, Updated: ${s.updated_at}, Status: ${s.status}, Adults: M=${s.stats_adults_men}/F=${s.stats_adults_women}, Teenagers: B=${s.stats_teenagers_boys}/G=${s.stats_teenagers_girls}`);
        });
    } catch (e) {
        console.error("Exception:", e);
    }
}

check();
