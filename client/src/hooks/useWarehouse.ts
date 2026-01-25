import { useState, useEffect } from "react";
import { InventoryItem, warehouseApi } from "../api/warehouse";

export function useWarehouse() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchInventory = async () => {
        try {
            setIsLoading(true);
            const data = await warehouseApi.getInventory();
            setInventory(data);
            setError(null);
        } catch (err) {
            setError("Erro ao carregar estoque");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const addInventory = async (item: Omit<InventoryItem, "id" | "createdAt" | "history" | "status">) => {
        try {
            const newItem = await warehouseApi.addInventory(item);
            setInventory((prev) => [...prev, newItem]);
            return newItem;
        } catch (err) {
            setError("Erro ao adicionar ao estoque");
            throw err;
        }
    };

    const processSale = async (type: "egg" | "meat" | "chick", subtype: string, quantity: number, context: string = "venda", fichaTecnica?: any[]) => {
        try {
            const results = await warehouseApi.processSale(type, subtype, quantity, context, fichaTecnica);
            await fetchInventory(); // Refresh to show updated quantities
            return results;
        } catch (err) {
            setError("Erro ao processar venda no estoque");
            throw err;
        }
    };

    return {
        inventory,
        isLoading,
        error,
        addInventory,
        processSale,
        refresh: fetchInventory,
    };
}
