const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ujrthsaahokpsxhvzxqg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqcnRoc2FhaG9rcHN4aHZ6eHFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDYwMjQ1NywiZXhwIjoyMDgwMTc4NDU3fQ.A9O3n3Fzo_txO6iLU92GTiCEfUuZQbWvbWtMJ2ekEaw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    try {
        console.log("Checking churches columns...");
        const { data, error } = await supabase
            .from('churches')
            .select('*')
            .limit(1);

        if (error) {
            console.error("Error:", error);
            return;
        }

        if (data && data.length > 0) {
            console.log("Found columns:", Object.keys(data[0]));
            console.log("First record:", data[0]);
        } else {
            console.log("No data in churches.");
        }
    } catch (e) {
        console.error("Exception:", e);
    }
}

check();
