import { supabaseClient } from "./supabaseClient";

export interface Production {
  id: string;
  groupId: string;
  cageId?: string;
  date: string;
  quantity: number;
  weight?: number;
  quality: "A" | "B" | "C";
  destination: "Venda" | "Consumo interno" | "Incubação" | "Outros";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductionRequest {
  groupId: string;
  cageId?: string;
  date: string;
  quantity: number;
  weight?: number;
  quality: "A" | "B" | "C";
  destination: "Venda" | "Consumo interno" | "Incubação" | "Outros";
  notes?: string;
}

export interface UpdateProductionRequest extends Partial<CreateProductionRequest> { }

export const productionApi = {
  getByGroupId: async (groupId: string): Promise<Production[]> => {
    return supabaseClient.get(`/groups/${groupId}/production`);
  },

  getAll: async (): Promise<Production[]> => {
    return supabaseClient.get("/production");
  },

  getById: async (id: string): Promise<Production> => {
    return supabaseClient.get(`/production/${id}`);
  },

  create: async (data: CreateProductionRequest): Promise<Production> => {
    return supabaseClient.post("/production", data);
  },

  update: async (id: string, data: UpdateProductionRequest): Promise<Production> => {
    return supabaseClient.put(`/production/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    return supabaseClient.delete(`/production/${id}`);
  },

  getProductionStats: async (groupId: string): Promise<{
    totalQuantity: number;
    totalWeight: number;
    averageQuality: string;
  }> => {
    return supabaseClient.get(`/groups/${groupId}/production/stats`);
  },
};
