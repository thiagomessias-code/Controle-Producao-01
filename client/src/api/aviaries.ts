import supabaseClient from "./supabaseClient";

export interface Aviary {
    id: string;
    name: string;
    capacity: number;
    location: string;
    status: "active" | "inactive" | "maintenance";
}

// Mock Data for Aviaries
const MOCK_AVIARIES: Aviary[] = [
    {
        id: "aviary-sp",
        name: "Aviário São Paulo",
        capacity: 100000,
        location: "São Paulo",
        status: "active"
    }
];

export const aviariesApi = {
    getAll: async (): Promise<Aviary[]> => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_AVIARIES;
    },

    getById: async (id: string): Promise<Aviary | null> => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_AVIARIES.find(a => a.id === id) || null;
    }
};
