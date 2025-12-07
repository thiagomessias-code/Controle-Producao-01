import { supabaseClient } from "./supabaseClient";

export interface HistoryEvent {
  date: string;
  event: string;
  quantity?: number;
  origin?: string;
  details?: string;
}

export interface Batch {
  id: string;
  name: string;
  species: string;
  quantity: number;
  birthDate?: string; // ISO Date string
  cageId?: string; // Link to Cage
  status: "active" | "inactive" | "sold";
  phase?: "caricoto" | "crescimento" | "postura" | "machos" | "reprodutoras";
  originId?: string; // ID of the incubation batch
  batchId?: string; // Lote ID (legacy/external)
  notes?: string;
  history?: HistoryEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateBatchRequest {
  name: string;
  species: string;
  quantity: number;
  cageId?: string;
  phase?: "caricoto" | "crescimento" | "postura" | "machos" | "reprodutoras";
  originId?: string;
  batchId?: string;
  birthDate?: string;
  notes?: string;
  history?: HistoryEvent[];
}

export interface UpdateBatchRequest extends Partial<CreateBatchRequest> {
  status?: "active" | "inactive" | "sold";
  phase?: "caricoto" | "crescimento" | "postura" | "machos" | "reprodutoras";
}

// MOCK: LocalStorage Persistence
const STORAGE_KEY = "mock_batches";

const DEFAULT_BATCHES: Batch[] = [
  {
    id: "batch-p1",
    name: "Lote P1-2024",
    species: "Codornas Japonesas",
    quantity: 95,
    cageId: "cage-p1",
    status: "active",
    phase: "postura",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    birthDate: "2024-01-15"
  },
  {
    id: "batch-m1",
    name: "Lote M1-2024",
    species: "Codornas Japonesas",
    quantity: 45,
    cageId: "cage-m1",
    status: "active",
    phase: "machos",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    birthDate: "2024-02-01"
  }
];

const loadBatches = (): Batch[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BATCHES));
    return DEFAULT_BATCHES;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_BATCHES;
  }
};

const saveBatches = (batches: Batch[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(batches));
};

export const batchesApi = {
  getAll: async (): Promise<Batch[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return loadBatches();
  },

  getById: async (id: string): Promise<Batch> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const batches = loadBatches();
    const batch = batches.find(b => b.id === id);
    if (!batch) throw new Error("Batch not found");
    return batch;
  },

  getByCageId: async (cageId: string): Promise<Batch[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const batches = loadBatches();
    return batches.filter(b => b.cageId === cageId);
  },

  create: async (data: CreateBatchRequest): Promise<Batch> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const batches = loadBatches();
    const newBatch: Batch = {
      id: `batch-${Date.now()}`,
      ...data,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    batches.push(newBatch);
    saveBatches(batches);
    return newBatch;
  },

  update: async (id: string, data: UpdateBatchRequest): Promise<Batch> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const batches = loadBatches();
    const index = batches.findIndex(b => b.id === id);
    if (index === -1) throw new Error("Batch not found");

    const updatedBatch = { ...batches[index], ...data, updatedAt: new Date().toISOString() };
    batches[index] = updatedBatch;
    saveBatches(batches);
    return updatedBatch;
  },

  delete: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    let batches = loadBatches();
    batches = batches.filter(b => b.id !== id);
    saveBatches(batches);
  },

  generateQRCode: async (batchId: string): Promise<string> => {
    return `BATCH-${batchId}`;
  },
};
