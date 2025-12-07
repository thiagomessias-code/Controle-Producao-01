import { supabaseClient } from "./supabaseClient";

export interface InventoryItem {
    id: string;
    type: "egg" | "meat" | "chick";
    subtype: string; // e.g., "ovo cru", "codorna abatida"
    quantity: number;
    origin: {
        groupId: string;
        batchId?: string;
        date: string; // Production/Slaughter date
    };
    createdAt: string;
    expirationDate?: string; // Validade
    history: InventoryHistory[];
    status: "in_stock" | "sold_out";
}

export interface InventoryHistory {
    date: string;
    action: "entry" | "sale" | "adjustment";
    quantity: number;
    details?: string;
}

export const warehouseApi = {
    getInventory: async (): Promise<InventoryItem[]> => {
        return supabaseClient.get<InventoryItem[]>("/warehouse");
    },

    addInventory: async (item: Omit<InventoryItem, "id" | "createdAt" | "expirationDate">): Promise<InventoryItem> => {
        // Calculate Expiration Date
        const entryDate = new Date(item.origin.date);
        let expirationDate = new Date(entryDate);

        if (item.type === "egg") {
            expirationDate.setDate(entryDate.getDate() + 30); // 30 days for eggs
        } else if (item.type === "meat") {
            expirationDate.setDate(entryDate.getDate() + 180); // 180 days for meat
        } else if (item.type === "chick") {
            expirationDate.setDate(entryDate.getDate() + 5); // 5 days for chicks (example)
        }

        const newItem = {
            ...item,
            expirationDate: expirationDate.toISOString(),
            history: [{
                date: new Date().toISOString(),
                action: "entry",
                quantity: item.quantity,
                details: "Entrada inicial no estoque"
            }],
            status: "in_stock"
        };

        return supabaseClient.post<InventoryItem>("/warehouse", newItem);
    },

    // Deducts quantity from inventory, prioritizing older items (FIFO)
    // Returns the list of items updated/removed
    processSale: async (type: "egg" | "meat", subtype: string, quantity: number): Promise<void> => {
        // This logic is complex for a simple mock, so we'll implement a simplified version
        // that just finds items and reduces quantity.
        // In a real backend, this would be a transaction.

        const inventory = await warehouseApi.getInventory();

        // Filter relevant items (only in_stock), sorted by Expiration Date (FEFO)
        const items = inventory
            .filter(i => i.type === type && i.subtype === subtype && i.status === "in_stock")
            .sort((a, b) => {
                const dateA = a.expirationDate ? new Date(a.expirationDate).getTime() : new Date(a.origin.date).getTime();
                const dateB = b.expirationDate ? new Date(b.expirationDate).getTime() : new Date(b.origin.date).getTime();
                return dateA - dateB;
            });

        const totalAvailable = items.reduce((sum, i) => sum + i.quantity, 0);

        if (totalAvailable < quantity) {
            throw new Error(`Estoque insuficiente. Disponível: ${totalAvailable}, Solicitado: ${quantity}`);
        }

        let remainingToDeduct = quantity;

        for (const item of items) {
            if (remainingToDeduct <= 0) break;

            if (item.quantity <= remainingToDeduct) {
                // Consume entire item (Soft Delete)
                const updatedHistory = [
                    ...(item.history || []),
                    {
                        date: new Date().toISOString(),
                        action: "sale",
                        quantity: item.quantity,
                        details: "Venda total - Lote esgotado"
                    }
                ];

                await supabaseClient.put(`/warehouse/${item.id}`, {
                    quantity: 0,
                    status: "sold_out",
                    history: updatedHistory
                });
            } else {
                // Partial consumption
                const updatedHistory = [
                    ...(item.history || []),
                    {
                        date: new Date().toISOString(),
                        action: "sale",
                        quantity: remainingToDeduct,
                        details: "Venda realizada"
                    }
                ];

                await supabaseClient.put(`/warehouse/${item.id}`, {
                    quantity: item.quantity - remainingToDeduct,
                    history: updatedHistory
                });
                remainingToDeduct = 0;
            }
        }
    }
};
