import { supabaseClient } from "./supabaseClient";

export interface Aviary {
    id: string;
    name: string;
    capacity: number;
    quantity: number;
    location: string;
    status: "active" | "inactive" | "maintenance";
}

export const aviariesApi = {
    getAll: async (): Promise<Aviary[]> => {
        // Use direct path /aviarios if supabaseClient mapping is unreliable, 
        // or rely on mapping if I add it.
        // Let's use the Portuguese path directly to be safe and explicit.
        const data = await supabaseClient.get<any[]>("/aviarios");
        return data.map(mapAviaryFromBackend);
    },

    getById: async (id: string): Promise<Aviary | null> => {
        const data = await supabaseClient.get<any>(`/aviarios/${id}`);
        return mapAviaryFromBackend(data);
    }
};

const mapAviaryFromBackend = (data: any): Aviary => {
    return {
        id: data.id,
        name: data.nome || data.name,
        capacity: data.capacidade || data.capacity || 0,
        quantity: data.quantidade_atual || data.quantity || 0,
        location: data.cidade || data.localizacao || data.location || "Não informada",
        status: (data.status === 1 || data.status === 'ativo' || data.status === 'active') ? 'active' : 'inactive'
    };
};
