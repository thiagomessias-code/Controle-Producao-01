import { supabaseClient } from "./supabaseClient";

export interface Mortality {
  id: string;
  groupId: string;
  cageId?: string;
  date: string;
  quantity: number;
  cause: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMortalityRequest {
  groupId: string;
  cageId?: string;
  date: string;
  quantity: number;
  cause: string;
  notes?: string;
}

export interface UpdateMortalityRequest extends Partial<CreateMortalityRequest> { }

export const mortalityApi = {
  getByGroupId: async (groupId: string): Promise<Mortality[]> => {
    return supabaseClient.get(`/groups/${groupId}/mortality`);
  },

  getAll: async (): Promise<Mortality[]> => {
    return supabaseClient.get("/mortality");
  },

  getById: async (id: string): Promise<Mortality> => {
    return supabaseClient.get(`/mortality/${id}`);
  },

  create: async (data: CreateMortalityRequest): Promise<Mortality> => {
    return supabaseClient.post("/mortality", data);
  },

  update: async (id: string, data: UpdateMortalityRequest): Promise<Mortality> => {
    return supabaseClient.put(`/mortality/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    return supabaseClient.delete(`/mortality/${id}`);
  },

  getMortalityStats: async (groupId: string): Promise<{
    totalDeaths: number;
    mortalityRate: number;
    commonCauses: string[];
  }> => {
    return supabaseClient.get(`/groups/${groupId}/mortality/stats`);
  },
};
