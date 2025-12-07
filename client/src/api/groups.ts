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
    species: string;
    quantity: number;
    birthDate?: string;
    location: string;
    status: "active" | "inactive" | "sold";
    phase?: "caricoto" | "crescimento" | "postura";
    originId?: string;
    batchId?: string;
    notes?: string;
    history?: HistoryEvent[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateGroupRequest {
    name: string;
    species: string;
    quantity: number;
    birthDate?: string;
    location: string;
    phase?: "caricoto" | "crescimento" | "postura";
    originId?: string;
    batchId?: string;
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
        return supabaseClient.get<Group[]>("/groups");
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
        return supabaseClient.delete(`/groups/${id}`);
    },
};
