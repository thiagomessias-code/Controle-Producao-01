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

// MOCK: LocalStorage Persistence
const STORAGE_KEY = "mock_cages";

const DEFAULT_CAGES: Cage[] = [
    { id: "cage-p1", name: "Gaiola P1", groupId: "group-produtoras", capacity: 100, currentQuantity: 95, status: "active", type: "production" },
    { id: "cage-p2", name: "Gaiola P2", groupId: "group-produtoras", capacity: 100, currentQuantity: 80, status: "active", type: "production" },
    { id: "cage-m1", name: "Gaiola M1", groupId: "group-machos", capacity: 50, currentQuantity: 45, status: "active", type: "males" },
    { id: "cage-r1", name: "Gaiola R1", groupId: "group-reprodutoras", capacity: 80, currentQuantity: 70, status: "active", type: "breeders" },
];

const loadCages = (): Cage[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    let cages: Cage[] = [];

    if (stored) {
        try {
            cages = JSON.parse(stored);
        } catch {
            cages = [];
        }
    }

    // Ensure default cages exist
    let hasChanges = false;
    DEFAULT_CAGES.forEach(defaultCage => {
        if (!cages.find(c => c.id === defaultCage.id)) {
            cages.push(defaultCage);
            hasChanges = true;
        }
    });

    if (hasChanges) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cages));
    }

    return cages;
};

const saveCages = (cages: Cage[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cages));
};

export const cagesApi = {
    getAll: async (): Promise<Cage[]> => {
        await new Promise(resolve => setTimeout(resolve, 300));
        return loadCages();
    },

    getById: async (id: string): Promise<Cage | null> => {
        await new Promise(resolve => setTimeout(resolve, 300));
        const cages = loadCages();
        return cages.find(c => c.id === id) || null;
    },

    getByGroupId: async (groupId: string): Promise<Cage[]> => {
        await new Promise(resolve => setTimeout(resolve, 300));
        const cages = loadCages();
        return cages.filter(c => c.groupId === groupId);
    },

    create: async (data: CreateCageRequest): Promise<Cage> => {
        await new Promise(resolve => setTimeout(resolve, 300));
        const cages = loadCages();
        const newCage: Cage = {
            id: `cage-${Date.now()}`,
            ...data,
            currentQuantity: 0,
            status: data.status || "active",
            type: data.type || "production",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        cages.push(newCage);
        saveCages(cages);
        return newCage;
    },

    update: async (id: string, data: UpdateCageRequest): Promise<Cage> => {
        await new Promise(resolve => setTimeout(resolve, 300));
        const cages = loadCages();
        const index = cages.findIndex(c => c.id === id);
        if (index === -1) throw new Error("Cage not found");

        const updatedCage = { ...cages[index], ...data, updatedAt: new Date().toISOString() };
        cages[index] = updatedCage;
        saveCages(cages);
        return updatedCage;
    },

    delete: async (id: string): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, 300));
        let cages = loadCages();
        cages = cages.filter(c => c.id !== id);
        saveCages(cages);
    },
};
