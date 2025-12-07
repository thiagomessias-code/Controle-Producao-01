import { supabaseClient } from "./supabaseClient";

export interface HistoryEvent {
  date: string;
  event: string;
  quantity?: number;
  origin?: string;
  details?: string;
}

export interface Incubation {
  id: string;
  batchNumber: string;
  eggQuantity: number;
  startDate: string;
  expectedHatchDate: string;
  actualHatchDate?: string;
  hatchedQuantity?: number;
  species: string;
  temperature: number;
  humidity: number;
  status: "incubating" | "hatched" | "failed";
  notes?: string;
  history?: HistoryEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateIncubationRequest {
  batchNumber: string;
  eggQuantity: number;
  species: string;
  startDate: string;
  expectedHatchDate: string;
  temperature: number;
  humidity: number;
  notes?: string;
  history?: HistoryEvent[];
}

export interface UpdateIncubationRequest extends Partial<CreateIncubationRequest> {
  status?: "incubating" | "hatched" | "failed";
  actualHatchDate?: string;
  hatchedQuantity?: number;
}

export const incubationApi = {
  getAll: async (): Promise<Incubation[]> => {
    return supabaseClient.get("/incubation");
  },

  getById: async (id: string): Promise<Incubation> => {
    return supabaseClient.get(`/incubation/${id}`);
  },

  create: async (data: CreateIncubationRequest): Promise<Incubation> => {
    return supabaseClient.post("/incubation", data);
  },

  update: async (id: string, data: UpdateIncubationRequest): Promise<Incubation> => {
    return supabaseClient.put(`/incubation/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    return supabaseClient.delete(`/incubation/${id}`);
  },

  getIncubationStats: async (): Promise<{
    totalBatches: number;
    totalEggs: number;
    successRate: number;
  }> => {
    return supabaseClient.get("/incubation/stats");
  },
};
