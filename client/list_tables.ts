
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xgfstwwvgiyhvogidtze.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZnN0d3d2Z2l5aHZvZ2lkdHplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODcyNzksImV4cCI6MjA3OTc2MzI3OX0.aVLI2zHIhRUyzDxaeiRTIP50UGtLKfLzR36inDADApE";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function list() {
    console.log("--- Listing Tables ---");
    // We can't list tables directly via Supabase client without RPC or querying information_schema
    // But we can try to guess or use RPC if it's there.
    // Instead, I'll try to query common tables to see if they exist.
    const potential = ['estoque_itens', 'estoque', 'inventory', 'warehouse', 'producao_ovos', 'rollouts', 'lotes'];
    for (const t of potential) {
        const { data, error } = await supabase.from(t).select('*').limit(1);
        if (error) {
            console.log(`[ ] ${t}: ${error.message}`);
        } else {
            console.log(`[x] ${t}: ${data.length} records sample`);
        }
    }
}

list();
