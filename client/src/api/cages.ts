import supabaseClient from "./supabaseClient";

export interface Cage {
    id: string;
    name: string;
    groupId: string; // Link to Group (Shed)
    capacity: number;
    currentQuantity: number;
    status: "active" | "inactive" | "maintenance";
    type: "production" | "males" | "breeders";
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateCageRequest {
    name: string;
    groupId: string;
    capacity: number;
    status?: "active" | "inactive" | "maintenance";
    type?: "production" | "males" | "breeders";
}

export interface UpdateCageRequest {
    name?: string;
    groupId?: string;
    capacity?: number;
    currentQuantity?: number;
    status?: "active" | "inactive" | "maintenance";
    type?: "production" | "males" | "breeders";
}

export const cagesApi = {
    getAll: async (): Promise<Cage[]> => {
        const data = await supabaseClient.get<any[]>("/gaiolas");
        return data.map(mapCageFromBackend);
    },

    getById: async (id: string): Promise<Cage | null> => {
        const data = await supabaseClient.get<any>(`/gaiolas/${id}`);
        return mapCageFromBackend(data);
    },

    getByGroupId: async (groupId: string): Promise<Cage[]> => {
        // Using explicit query param or if backend supports path based filtering
        const data = await supabaseClient.get<any[]>(`/gaiolas?galpao_id=${groupId}`);
        return data.map(mapCageFromBackend);
    },

    create: async (data: CreateCageRequest): Promise<Cage> => {
        return supabaseClient.post<Cage>("/gaiolas", data);
    },

    update: async (id: string, data: UpdateCageRequest): Promise<Cage> => {
        return supabaseClient.put<Cage>(`/gaiolas/${id}`, data);
    },

    delete: async (id: string): Promise<void> => {
        return supabaseClient.delete(`/gaiolas/${id}`);
    },
};

const mapCageFromBackend = (data: any): Cage => {
    return {
        id: data.id,
        name: data.nome || data.name,
        groupId: data.galpao_id || data.groupId,
        capacity: data.capacidade || data.capacity || 50,
        currentQuantity: data.quantidade_atual || data.currentQuantity || 0,
        status: (data.status === 'ativo' || data.status === 'active') ? 'active' : 'inactive',
        type: data.tipo || data.type || 'production',
        createdAt: data.created_at || data.createdAt,
        updatedAt: data.updated_at || data.updatedAt
    };
};
