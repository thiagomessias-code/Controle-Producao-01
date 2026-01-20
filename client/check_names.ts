
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xgfstwwvgiyhvogidtze.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZnN0d3d2Z2l5aHZvZ2lkdHplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODcyNzksImV4cCI6MjA3OTc2MzI3OX0.aVLI2zHIhRUyzDxaeiRTIP50UGtLKfLzR36inDADApE";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    console.log("--- Checking Product Names ---");
    const { data: prods } = await supabase.from('produtos').select('nome, tipo').eq('ativo', true);
    console.log("Active Products:", prods?.map(p => p.nome));

    console.log("\n--- Checking Inventory Items ---");
    const { data: inv } = await supabase.from('estoque_itens').select('nome, categoria, quantidade_atual');
    console.log("All Inventory:", inv?.map(i => `${i.nome} (${i.categoria}): ${i.quantidade_atual}`));
}

check();
