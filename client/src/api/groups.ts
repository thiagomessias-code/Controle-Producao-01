import { supabaseClient } from "./supabaseClient";

export interface HistoryEvent {
    date: string;
    event: string;
    quantity: number;
    details: string;
    origin?: string;
}

export interface Group {
    id: string;
    name: string;
    type?: string;
    capacity: number;
    species: string;
    quantity: number;
    birthDate?: string;
    location: string;
    status: "active" | "inactive" | "sold";
    phase?: "caricoto" | "crescimento" | "postura";
    originId?: string;
    batchId?: string;
    aviaryId?: string; // Linked Aviary
    notes?: string;
    history?: HistoryEvent[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateGroupRequest {
    name: string;
    type?: string;
    species: string;
    quantity: number;
    birthDate?: string;
    location: string;
    phase?: "caricoto" | "crescimento" | "postura";
    originId?: string;
    batchId?: string;
    aviaryId?: string; // Linked Aviary
    notes?: string;
    history?: HistoryEvent[];
}

export interface UpdateGroupRequest {
    name?: string;
    species?: string;
    quantity?: number;
    birthDate?: string;
    location?: string;
    status?: "active" | "inactive" | "sold";
    phase?: "caricoto" | "crescimento" | "postura";
    notes?: string;
    history?: HistoryEvent[];
}

export const groupsApi = {
    getAll: async (): Promise<Group[]> => {
        const data = await supabaseClient.get<any[]>("/galpoes");
        return data.map(mapGroupFromBackend);
    },

    getById: async (id: string): Promise<Group> => {
        return supabaseClient.get<Group>(`/groups/${id}`);
    },

    create: async (data: CreateGroupRequest): Promise<Group> => {
        return supabaseClient.post<Group>("/groups", data);
    },

    update: async (id: string, data: UpdateGroupRequest): Promise<Group> => {
        return supabaseClient.put<Group>(`/groups/${id}`, data);
    },

    delete: async (id: string): Promise<void> => {
        return supabaseClient.delete(`/galpoes/${id}`);
    },
};

const mapGroupFromBackend = (data: any): Group => {
    let type = '';
    const backendType = (data.tipo || '').toLowerCase();
    const name = (data.nome || '').toLowerCase();

    if (name.includes('macho')) type = 'males';
    else if (name.includes('reprod') || name.includes('matriz')) type = 'breeders';
    else if (backendType.includes('macho')) type = 'males';
    else if (backendType.includes('reprod') || backendType.includes('matriz')) type = 'breeders';
    else if (backendType.includes('prod') || backendType.includes('postura')) type = 'production';

    return {
        id: data.id,
        name: data.nome || data.name,
        type: type, // Normalized type
        capacity: data.capacidade || data.capacity || 0,
        species: data.especie || data.species || "Codornas",
        quantity: data.quantidade_atual || data.quantity || 0,
        location: data.localizacao || data.location || "Interno",
        status: data.status === 1 || data.status === 'ativo' || data.status === 'active' ? 'active' : 'inactive',
        aviaryId: data.aviario_id || data.aviaryId,
        createdAt: data.created_at || data.createdAt,
        updatedAt: data.updated_at || data.updatedAt
    };
};
