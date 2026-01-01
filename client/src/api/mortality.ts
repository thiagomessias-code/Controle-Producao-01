import { supabaseClient } from "./supabaseClient";

export interface Mortality {
  id: string;
  groupId: string;
  cageId?: string;
  batchId?: string; // Standardized batch reference
  date: string;
  quantity: number;
  cause: string;
  notes?: string;
  userName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMortalityRequest {
  groupId: string;
  cageId?: string;
  batchId?: string; // Required for traceability
  date: string;
  quantity: number;
  cause: string;
  notes?: string;
  userId?: string;
}

export interface UpdateMortalityRequest extends Partial<CreateMortalityRequest> { }

export const mortalityApi = {
  getByGroupId: async (groupId: string): Promise<Mortality[]> => {
    const data = await supabaseClient.get(`/mortalidade?galpao_id=${groupId}`);
    return (data || []).map(mapToFrontend);
  },

  getByBatchId: async (batchId: string): Promise<Mortality[]> => {
    const data = await supabaseClient.get(`/mortalidade?lote_id=${batchId}`);
    return (data || []).map(mapToFrontend);
  },

  getAll: async (): Promise<Mortality[]> => {
    const data = await supabaseClient.get("/mortality");
    return (data || []).map(mapToFrontend);
  },

  getById: async (id: string): Promise<Mortality> => {
    return supabaseClient.get(`/mortality/${id}`);
  },

  create: async (data: CreateMortalityRequest): Promise<Mortality> => {
    const payload = {
      galpao_id: data.groupId,
      gaiola_id: data.cageId,
      lote_id: data.batchId,
      data_registro: data.date,
      quantidade: data.quantity,
      causa: data.cause,
      observacoes: data.notes,
      usuario_id: data.userId
    };
    const res = await supabaseClient.post("/mortality", payload);
    return mapToFrontend(res);
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

const mapToFrontend = (item: any): Mortality => ({
  id: item.id,
  groupId: item.galpao_id,
  cageId: item.gaiola_id,
  batchId: item.lote_id,
  date: item.data_registro,
  quantity: item.quantidade,
  cause: item.causa,
  notes: item.observacoes,
  userName: item.users?.name,
  createdAt: item.created_at,
  updatedAt: item.updated_at
});
