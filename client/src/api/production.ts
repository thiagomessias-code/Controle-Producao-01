import { supabaseClient } from "./supabaseClient";

export interface Production {
  id: string;
  groupId: string;
  cageId?: string;
  batchId?: string; // Standardized batch reference
  date: string;
  quantity: number;
  weight?: number;
  quality: "A" | "B" | "C";
  destination: "Venda" | "Consumo" | "Incubação" | "Perda" | "Outros";
  eggType?: "fertile" | "table";
  notes?: string;
  userName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductionRequest {
  groupId: string;
  cageId?: string;
  batchId?: string; // Required for traceability
  date: string;
  quantity: number;
  weight?: number;
  quality: "A" | "B" | "C";
  destination: "Venda" | "Consumo" | "Incubação" | "Perda" | "Outros";
  eggType?: "fertile" | "table";
  notes?: string;
  userId?: string;
}

export interface UpdateProductionRequest extends Partial<CreateProductionRequest> { }

export const productionApi = {
  getByGroupId: async (groupId: string): Promise<Production[]> => {
    // Backend filter by galpao_id
    const data = await supabaseClient.get(`/producao?galpao_id=${groupId}`);
    return (data || []).map(mapToFrontend);
  },

  getByBatchId: async (batchId: string): Promise<Production[]> => {
    const data = await supabaseClient.get(`/producao?lote_id=${batchId}`);
    return (data || []).map(mapToFrontend);
  },

  getAll: async (): Promise<Production[]> => {
    const data = await supabaseClient.get("/producao");
    return (data || []).map(mapToFrontend);
  },

  getById: async (id: string): Promise<Production> => {
    const data = await supabaseClient.get(`/producao/${id}`);
    return mapToFrontend(data);
  },

  create: async (data: CreateProductionRequest): Promise<Production> => {
    // Map frontend 'fertile'/'table' to backend 'fertil'/'comercial'
    const tipoOvoMap: Record<string, string> = {
      'fertile': 'fertil',
      'table': 'comercial',
    };

    const destinoMap: Record<string, string> = {
      "Venda": "venda",
      "Consumo": "consumo_proprio",
      "Incubação": "incubacao",
      "Perda": "perda",
      "Outros": "venda", // Fallback
    };

    const payload = {
      data_producao: data.date,
      quantidade: data.quantity,
      tipo_ovo: tipoOvoMap[data.eggType || 'table'] || 'comercial',
      galpao_id: data.groupId,
      lote_id: data.batchId,
      gaiola_id: data.cageId,
      destino: destinoMap[data.destination] || 'venda',
      qualidade: data.quality,
      peso: data.weight,
      observacoes: data.notes,
      usuario_id: data.userId
    };
    const res = await supabaseClient.post("/producao", payload);
    return mapToFrontend(res);
  },

  update: async (id: string, data: UpdateProductionRequest): Promise<Production> => {
    const payload: any = {};
    if (data.date) payload.data_producao = data.date;
    if (data.quantity) payload.quantidade = data.quantity;
    if (data.eggType) payload.tipo_ovo = data.eggType;
    if (data.groupId) payload.galpao_id = data.groupId;
    if (data.batchId) payload.lote_id = data.batchId;
    if (data.cageId) payload.gaiola_id = data.cageId;
    if (data.destination) payload.destino = data.destination;
    if (data.quality) payload.qualidade = data.quality;
    if (data.weight) payload.peso = data.weight;
    if (data.notes) payload.observacoes = data.notes;

    const res = await supabaseClient.put(`/producao/${id}`, payload);
    return mapToFrontend(res);
  },

  delete: async (id: string): Promise<void> => {
    await supabaseClient.delete(`/producao/${id}`);
  },

  getProductionStats: async (groupId: string): Promise<{
    totalQuantity: number;
    totalWeight: number;
    averageQuality: string;
  }> => {
    // Backend doesn't have a specific stats endpoint in routes.ts?
    // We can fetch all and calc, or implement one.
    // For now, let's fetch all (which is what getByGroupId does) and calc client side if needed 
    // OR backend might support it and I missed it?
    // Let's assume generic fetch for now or return 0s if not critical. 
    // Valid approach: Fetch list and reduce.
    const list = await productionApi.getByGroupId(groupId);
    return {
      totalQuantity: list.reduce((acc, p) => acc + p.quantity, 0),
      totalWeight: list.reduce((acc, p) => acc + (p.weight || 0), 0),
      averageQuality: "A" // Placeholder
    };
  },
};

const mapToFrontend = (item: any): Production => ({
  id: item.id,
  groupId: item.galpao_id,
  cageId: item.gaiola_id,
  batchId: item.lote_id,
  date: item.data_producao,
  quantity: item.quantidade,
  weight: item.peso,
  quality: item.qualidade || "A",
  destination: item.destino === "consumo_proprio" ? "Consumo" : (item.destino === "venda" ? "Venda" : (item.destino || "Venda")),
  eggType: item.tipo_ovo,
  notes: item.observacoes,
  userName: item.users?.name,
  createdAt: item.created_at,
  updatedAt: item.updated_at
});
