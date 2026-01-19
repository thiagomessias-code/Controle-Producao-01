import { createClient } from "@supabase/supabase-js";
const supabaseUrl = "https://xgfstwwvgiyhvogidtze.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZnN0d3d2Z2l5aHZvZ2lkdHplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODcyNzksImV4cCI6MjA3OTc2MzI3OX0.aVLI2zHIhRUyzDxaeiRTIP50UGtLKfLzR36inDADApE";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debug() {
    console.log("--- Debugging Losses & Consumption ---");

    // 1. Producao Ovos
    console.log("\n1. Querying producao_ovos (destino in 'perda', 'consumo_proprio')...");
    const { data: prodLoss, error: prodError } = await supabase.from('producao_ovos')
        .select('id, data_producao, quantidade, destino, observacoes, lotes(name), gaiolas(nome)')
        .in('destino', ['perda', 'consumo_proprio']);

    if (prodError) console.error("Error producao_ovos:", prodError);
    else console.log(`Found ${prodLoss?.length} records:`, prodLoss);

    // 2. Mortalidade
    console.log("\n2. Querying mortalidade...");
    const { data: mortality, error: mortError } = await supabase.from('mortalidade')
        .select('id, data_registro, quantidade, causa, lotes(name), gaiolas(nome)');

    if (mortError) console.error("Error mortalidade:", mortError);
    else console.log(`Found ${mortality?.length} records:`, mortality);

    // 3. Movimentacoes
    console.log("\n3. Querying estoque_movimentacoes...");
    const { data: stockAdj, error: stockError } = await supabase.from('estoque_movimentacoes')
        .select('id, data_movimentacao, quantidade, origem_tipo, observacao, estoque_itens(nome, categoria)')
        .or('tipo.eq.AJUSTE,origem_tipo.eq.perda,origem_tipo.eq.consumo');

    if (stockError) console.error("Error estoque_movimentacoes:", stockError);
    else console.log(`Found ${stockAdj?.length} records:`, stockAdj);

    // 4. Check all producao_ovos to see what 'destino' values exist
    console.log("\n4. Checking distinct destination values in producao_ovos...");
    const { data: allDest, error: destError } = await supabase.from('producao_ovos').select('destino');
    if (destError) console.error(destError);
    else {
        const unique = [...new Set(allDest.map(d => d.destino))];
        console.log("Existing destinations:", unique);
    }
}

debug();
