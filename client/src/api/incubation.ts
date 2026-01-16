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
  batchId?: string;
  batchNumber: string;
  eggQuantity: number;
  startDate: string;
  expectedHatchDate: string;
  actualHatchDate?: string;
  hatchedQuantity?: number;
  species: string;
  temperature: number;
  humidity: number;
  status: "incubating" | "hatched" | "failed" | "completed";
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
  status?: "incubating" | "hatched" | "failed"; // Added status
  history?: HistoryEvent[];
}

export interface UpdateIncubationRequest extends Partial<CreateIncubationRequest> {
  status?: "incubating" | "hatched" | "failed" | "completed";
  actualHatchDate?: string;
  hatchedQuantity?: number;
}

export const incubationApi = {
  getAll: async (): Promise<Incubation[]> => {
    const data = await supabaseClient.get<any[]>("/incubation");
    if (!Array.isArray(data)) return [];
    return data.map(mapIncubationFromBackend);
  },

  getById: async (id: string): Promise<Incubation> => {
    const data = await supabaseClient.get<any>(`/incubation/${id}`);
    return mapIncubationFromBackend(data);
  },

  create: async (data: CreateIncubationRequest): Promise<Incubation> => {
    const backendData = mapIncubationToBackend(data);
    const result = await supabaseClient.post<any>("/incubation", backendData);
    return mapIncubationFromBackend(result);
  },

  update: async (id: string, data: UpdateIncubationRequest): Promise<Incubation> => {
    // Partial mapping needed here. Implementing simple mapping for now.
    const backendData: any = {};
    if (data.status) backendData.status = data.status; // Check if backend supports status update via body or if it uses specific endpoints
    if (data.actualHatchDate) backendData.data_real_nascimento = data.actualHatchDate;
    if (data.hatchedQuantity) backendData.pintos_nascidos = data.hatchedQuantity;
    if (data.notes) backendData.observacoes = data.notes;
    // Note: finalize uses a different endpoint usually, but we are fixing generic update here.

    return supabaseClient.put(`/incubation/${id}`, backendData);
  },

  finalize: async (id: string, data: {
    actualHatchDate: string;
    hatchedQuantity: number;
    eggQuantity: number;
    notes?: string;
    caixa_id: string; // Required for transfer to Growth Box
  }): Promise<any> => {
    const finalizeData = {
      data_real_nascimento: data.actualHatchDate,
      pintos_nascidos: data.hatchedQuantity,
      perdas: (data.eggQuantity || 0) - (data.hatchedQuantity || 0),
      observacoes: data.notes,
      caixa_id: data.caixa_id
    };
    return supabaseClient.put(`/incubation/${id}/finalizar`, finalizeData);
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

// Helper Mappings
const mapIncubationFromBackend = (data: any): Incubation => {
  return {
    id: data.id,
    batchId: data.lote_id, // Map valid Foreign Key
    batchNumber: data.numero_lote || extractBatchNumber(data.observacoes) || `LOTE-${data.created_at?.slice(0, 10)}`, // Fallback
    eggQuantity: data.quantidade_ovos,
    startDate: data.data_colocacao,
    expectedHatchDate: data.data_prevista_nascimento,
    actualHatchDate: data.data_real_nascimento,
    hatchedQuantity: data.pintos_nascidos,
    species: "Codornas Japonesas", // Default as DB might not have it yet
    temperature: 37.5, // Default
    humidity: 60, // Default
    status: ['finalizado', 'finalizada', 'concluido'].includes(data.status)
      ? 'completed'
      : (data.status === 'hatched' || (data.pintos_nascidos && data.pintos_nascidos > 0))
        ? 'hatched'
        : 'incubating',
    notes: data.observacoes,
    history: [], // DB doesn't seem to have history column in schema
    createdAt: data.created_at,
    updatedAt: data.created_at // fallback
  };
};

const mapIncubationToBackend = (data: CreateIncubationRequest): any => {
  return {
    // rollout_id: ... optional
    data_colocacao: data.startDate,
    quantidade_ovos: data.eggQuantity,
    data_prevista_nascimento: data.expectedHatchDate,
    observacoes: `Lote: ${data.batchNumber} | Espécie: ${data.species} | ${data.notes || ''}`
  };
};

const extractBatchNumber = (obs?: string): string | null => {
  if (!obs) return null;
  const match = obs.match(/Lote: (LOTE-\d+)/);
  return match ? match[1] : null;
};
