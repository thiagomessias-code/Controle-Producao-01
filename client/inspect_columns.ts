
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xgfstwwvgiyhvogidtze.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZnN0d3d2Z2l5aHZvZ2lkdHplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODcyNzksImV4cCI6MjA3OTc2MzI3OX0.aVLI2zHIhRUyzDxaeiRTIP50UGtLKfLzR36inDADApE";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
    console.log("--- Column Inspection ---");

    const tables = ['lotes', 'gaiolas', 'producao_ovos', 'mortalidade', 'estoque_itens', 'estoque_movimentacoes'];

    for (const table of tables) {
        console.log(`\nTable: ${table}`);
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.error(`Error fetching ${table}:`, error.message);
        } else if (data && data.length > 0) {
            console.log("Columns:", Object.keys(data[0]));
        } else {
            // Try to fetch column names from information_schema via RPC if available, 
            // but usually we can just look at the keys of an empty object if we can't find data.
            // If No data, we try another way.
            console.log("No data found to inspect columns.");
        }
    }
}

inspect();
