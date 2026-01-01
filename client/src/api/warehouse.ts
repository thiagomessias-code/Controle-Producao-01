import { supabaseClient } from "./supabaseClient";

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

    processSale: async (type: "egg" | "meat" | "chick", subtype: string, quantity: number, context: string = "venda"): Promise<any[]> => {
        // Find items (FIFO)
        const inventory = await warehouseApi.getInventory();
        const relevantItems = inventory
            .filter(i => i.type === type && i.subtype === subtype && i.quantity > 0)
            .sort((a, b) => new Date(a.origin.date).getTime() - new Date(b.origin.date).getTime());

        const totalAvailable = relevantItems.reduce((acc, i) => acc + i.quantity, 0);
        if (totalAvailable < quantity) throw new Error(`Estoque insuficiente. Disponível: ${totalAvailable}`);

        let remainingToDeduct = quantity;
        const originsUsed: any[] = [];

        for (const item of relevantItems) {
            if (remainingToDeduct <= 0) break;

            const amountFromThisItem = Math.min(item.quantity, remainingToDeduct);

            // Register Exit Movement
            await supabaseClient.post("/estoque/movimentacoes", {
                item_id: item.id,
                tipo: 'SAIDA',
                quantidade: amountFromThisItem,
                origem_tipo: context,
                observacao: `Baixa Automática (FIFO) - ${context}`
            });

            originsUsed.push({
                ...item.origin,
                quantity: amountFromThisItem
            });

            remainingToDeduct -= amountFromThisItem;
        }

        return originsUsed;
    }
};
