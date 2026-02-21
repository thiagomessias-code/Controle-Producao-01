import { supabaseClient, supabase } from "./supabaseClient";
import { normalizeText, matchWords } from "../utils/format";

// ... (rest of imports and interfaces)

export interface InventoryItem {
    id: string;
    type: "egg" | "meat" | "chick"; // Mapped from 'categoria'
    subtype: string; // Mapped from 'nome'
    quantity: number;
    origin: {
        groupId: string;
        batchId?: string;
        cageId?: string; // Added cageId
        date: string;
    };
    createdAt: string;
    expirationDate?: string;
    history: InventoryHistory[];
    status: "in_stock" | "sold_out";
}

export interface InventoryHistory {
    date: string;
    action: "entry" | "sale" | "adjustment";
    quantity: number;
    details?: string;
}

// Helper to map backend format to frontend
const mapCategoryToFrontend = (category: string, name: string): "egg" | "meat" | "chick" => {
    switch (category) {
        case "ovo": return "egg";
        case "carne": return "meat";
        case "insumo":
            if (name.toLowerCase().includes("pinto")) return "chick";
            return "chick";
        default: return "chick";
    }
};

const mapFromBackend = (item: any): InventoryItem => ({
    id: item.id,
    type: mapCategoryToFrontend(item.categoria, item.nome),
    subtype: item.nome,
    quantity: item.quantidade_atual,
    origin: {
        groupId: item.origem_grupo_id || "warehouse",
        batchId: item.origem_lote_id,
        cageId: item.origem_gaiola_id,
        date: item.created_at
    },
    createdAt: item.created_at,
    expirationDate: item.data_validade, // Map validity
    status: item.quantidade_atual > 0 ? "in_stock" : "sold_out",
    history: []
});

// Map Frontend Type to Backend Category
const mapTypeToBackend = (type: "egg" | "meat" | "chick"): string => {
    switch (type) {
        case "egg": return "ovo";
        case "meat": return "carne";
        case "chick": return "insumo";
        default: return "insumo";
    }
};

export const warehouseApi = {
    getInventory: async (): Promise<InventoryItem[]> => {
        const data = await supabaseClient.get<any[]>("/estoque/itens");
        return (data || []).map(mapFromBackend);
    },

    addInventory: async (item: Omit<InventoryItem, "id" | "createdAt" | "history" | "status">): Promise<InventoryItem> => {
        const backendCategory = mapTypeToBackend(item.type);

        // STRATEGY: 
        // For Production/Mortality (where origin is specific), we ALWAYS create a new item 
        // to preserve the specific Batch/Cage/Validity data (FIFO).
        // For generic items (if any), we might merge, but here we prioritize traceability.

        // Ensure name contains key info if needed, or rely on metadata columns
        // We will try to save separate items.

        let itemId: string | null = null;

        // If it looks like a generic items merge (e.g. existing logic), we check. 
        // But for "Ovo" or "Carne" from production, we want distinct cards.
        // We can check if 'batchId' is present. If yes -> New Item.

        const forceNewItem = !!item.origin.batchId;

        if (!forceNewItem) {
            const inventory = await warehouseApi.getInventory();
            const existingItem = inventory.find(i => i.subtype === item.subtype && i.type === item.type);
            itemId = existingItem?.id || null;
        }

        if (!itemId) {
            // Create new item definition
            const newItem = await supabaseClient.post<any>("/estoque/itens", {
                nome: item.subtype,
                categoria: backendCategory,
                quantidade_atual: 0,
                preco_medio: 0,
                status: 'ativo',
                // New Fields for Traceability (Best Effort - assuming backend supports or ignores extra fields)
                data_validade: item.expirationDate,
                origem_grupo_id: item.origin.groupId,
                origem_lote_id: item.origin.batchId,
                origem_gaiola_id: item.origin.cageId
            });
            itemId = newItem.id;
        }

        // 2. Register Entry Movement
        await supabaseClient.post("/estoque/movimentacoes", {
            item_id: itemId,
            tipo: 'ENTRADA',
            quantidade: item.quantity,
            origem_referencia_id: item.origin.batchId || item.origin.groupId,
            origem_tipo: 'producao',
            observacao: `Entrada: ${item.subtype}. Lote: ${item.origin.batchId || 'N/A'}. Gaiola: ${item.origin.cageId || 'N/A'}`
        });

        // Return updated item
        const updatedInventory = await warehouseApi.getInventory();
        return updatedInventory.find(i => i.id === itemId)!;
    },

    processSale: async (type: "egg" | "meat" | "chick", subtype: string, quantity: number, context: string = "venda", fichaTecnica?: any[]): Promise<any[]> => {
        const originsUsed: any[] = [];

        // If it's a derivative product (has fichaTecnica), we deduct each ingredient
        if (fichaTecnica && fichaTecnica.length > 0) {
            for (const ingredient of fichaTecnica) {
                const totalIngredientQty = ingredient.quantity * quantity;
                const ingredientOrigins = await warehouseApi.processSale(
                    ingredient.stock_type,
                    ingredient.raw_material_name,
                    totalIngredientQty,
                    `${context} (insumo de ${subtype})`,
                    [],
                    skipMovement
                );
                originsUsed.push(...ingredientOrigins);
            }
            return originsUsed;
        }

        // Standard deduction logic
        const inventory = await warehouseApi.getInventory();
        const relevantItems = inventory
            .filter(i => {
                const typeMatch = i.type === type;
                // Advanced matching using normalized text for plurals and accents
                const targetNorm = normalizeText(subtype);
                const invNorm = normalizeText(i.subtype);

                // STRICT Egg matching:
                // 1. Generic 'ovo' only matches if target is exactly 'ovo'
                if ((type === 'egg' || targetNorm.includes('ovo')) && (targetNorm === 'ovo' || targetNorm === 'ovos')) {
                    return invNorm.includes('ovo') && i.quantity > 0;
                }

                // Match using our multi-word logic
                const match = matchWords(targetNorm, invNorm);

                return typeMatch && match && i.quantity > 0;
            })
            .sort((a, b) => new Date(a.origin.date).getTime() - new Date(b.origin.date).getTime());

        console.log(`DEBUG processSale: Deducting ${quantity} of ${subtype} (${type}). Found ${relevantItems.length} matching inventory batches.`);

        const totalAvailable = relevantItems.reduce((acc, i) => acc + i.quantity, 0);
        if (totalAvailable < quantity) throw new Error(`Estoque insuficiente de ${subtype}. Disponível: ${totalAvailable}, Necessário: ${quantity}`);

        let remainingToDeduct = quantity;

        for (const item of relevantItems) {
            if (remainingToDeduct <= 0) break;

            const amountFromThisItem = Math.min(item.quantity, remainingToDeduct);

            // Register Exit Movement
            if (!skipMovement) {
                await supabaseClient.post("/estoque/movimentacoes", {
                    item_id: item.id,
                    tipo: 'SAIDA',
                    quantidade: amountFromThisItem,
                    origem_tipo: context,
                    observacao: `Baixa Automática (FIFO) - ${context}`
                });
            }

            originsUsed.push({
                ...item.origin,
                quantity: amountFromThisItem,
                itemId: item.id
            });

            remainingToDeduct -= amountFromThisItem;
        }

        if (remainingToDeduct > 0) {
            throw new Error(`Estoque insuficiente para ${subtype}. Faltam ${remainingToDeduct} unidades.`);
        }

        return originsUsed;
    },

    updateInventoryItem: async (id: string, updates: Partial<any>): Promise<void> => {
        const { error } = await supabase.from('estoque_itens').update(updates).eq('id', id);
        if (error) throw error;
    },

    deleteInventoryItem: async (id: string): Promise<void> => {
        const { error } = await supabase.from('estoque_itens').delete().eq('id', id);
        if (error) throw error;
    },

    getLossHistory: async (): Promise<any[]> => {
        // Fetch from 3 sources
        const [prodLoss, mortality, stockAdj] = await Promise.all([
            supabase.from('producao_ovos')
                .select('id, data_producao, quantidade, destino, observacoes, lotes(name), gaiolas(nome)')
                .in('destino', ['perda', 'consumo_proprio']),
            supabase.from('mortalidade')
                .select('id, data_registro, quantidade, causa, lotes(name), gaiolas(nome)'),
            supabase.from('estoque_movimentacoes')
                .select('id, data_movimentacao, quantidade, origem_tipo, observacao, estoque_itens(nome, categoria)')
                .or('tipo.eq.AJUSTE,origem_tipo.eq.perda,origem_tipo.eq.consumo,origem_tipo.eq.consumo_interno,origem_tipo.eq.consumo_proprio')
        ]);

        const unified: any[] = [];

        // 1. Eggs Loss/Consumption
        (prodLoss.data || []).forEach((p: any) => {
            unified.push({
                id: p.id,
                date: p.data_producao,
                type: p.destino === 'perda' ? 'Perda (Ovos)' : 'Consumo Interno (Ovos)',
                origin: `Lote: ${p.lotes?.name || '?'}, Gaiola: ${p.gaiolas?.nome || '?'}`,
                quantity: p.quantidade,
                reason: p.observacoes || 'Não especificado',
                source: 'Produção'
            });
        });

        // 2. Mortality (All mortality is effectively a loss)
        (mortality.data || []).forEach((m: any) => {
            unified.push({
                id: m.id,
                date: m.data_registro,
                type: 'Perda (Aves)',
                origin: `Lote: ${m.lotes?.name || '?'}, Gaiola: ${m.gaiolas?.nome || '?'}`,
                quantity: m.quantidade,
                reason: m.causa || 'Mortalidade',
                source: 'Campo'
            });
        });

        // 3. Stock Adjustments (Negative adjustments or marked as pérdida/consumo)
        (stockAdj.data || []).forEach((s: any) => {
            const isLoss = s.quantidade < 0 || s.origem_tipo?.includes('perda');
            const isConsumo = s.origem_tipo?.includes('consumo');
            if (!isLoss && !isConsumo) return;

            unified.push({
                id: s.id,
                date: s.data_movimentacao,
                type: isConsumo ? `Consumo (${s.estoque_itens?.nome || 'Insumo'})` : `Perda (${s.estoque_itens?.nome || 'Insumo'})`,
                origin: 'Armazém Central',
                quantity: Math.abs(s.quantidade),
                reason: s.observacao || 'Ajuste de estoque',
                source: 'Armazém'
            });
        });

        return unified.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
};
