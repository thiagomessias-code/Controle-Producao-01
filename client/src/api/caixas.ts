
import supabaseClient from "./supabaseClient";

export interface GrowthBox {
    id: string;
    name: string;
    aviaryId?: string; // mapped from aviario_id
    capacity: number;
    status: "active" | "inactive" | "maintenance";
    aviarios?: { nome: string; localizacao?: string; cidade?: string };
    createdAt?: string;
    updatedAt?: string;
    lotes?: any[]; // added lotes property
}

export interface CreateGrowthBoxRequest {
    name: string;
    aviario_id: string;
    capacity: number;
    status?: "active" | "inactive" | "maintenance";
}

export interface UpdateGrowthBoxRequest {
    name?: string;
    aviario_id?: string;
    capacity?: number;
    status?: "active" | "inactive" | "maintenance";
}

export const caixasApi = {
    getAll: async (): Promise<GrowthBox[]> => {
        const data = await supabaseClient.get<any[]>("/caixas");
        return data.map(mapBoxFromBackend);
    },

    getById: async (id: string): Promise<GrowthBox | null> => {
        const data = await supabaseClient.get<any>(`/caixas/${id}`);
        return mapBoxFromBackend(data);
    },

    getByAviaryId: async (aviaryId: string): Promise<GrowthBox[]> => {
        const data = await supabaseClient.get<any[]>(`/caixas?aviario_id=${aviaryId}`);
        return data.map(mapBoxFromBackend);
    },

    create: async (data: CreateGrowthBoxRequest): Promise<GrowthBox> => {
        return supabaseClient.post<GrowthBox>("/caixas", data);
    },

    update: async (id: string, data: UpdateGrowthBoxRequest): Promise<GrowthBox> => {
        return supabaseClient.put<GrowthBox>(`/caixas/${id}`, data);
    },

    delete: async (id: string): Promise<void> => {
        return supabaseClient.delete(`/caixas/${id}`);
    },
};

const mapBoxFromBackend = (data: any): GrowthBox => {
    // DEBUG: Log raw data for the first item only (to avoid spam)
    if (data.nome?.includes('Caixa001') || Math.random() < 0.05) {
        console.log('[API] mapBoxFromBackend RAW:', data);
    }
    return {
        id: data.id,
        name: data.nome,
        aviaryId: data.aviario_id,
        capacity: data.capacidade || 100,
        status: data.status || 'active',
        aviarios: data.aviarios,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        // Map lotes if they exist
        lotes: data.lotes?.map((l: any) => ({
            id: l.id,
            batchNumber: l.name,
            quantity: l.quantidade,
            birthDate: l.data_nascimento,
            status: l.status === 'ativo' ? 'active' : l.status,
            phase: l.fase,
            originId: l.origem_id,
            originType: l.origem_tipo,
            createdAt: l.created_at
        }))
    };
};
