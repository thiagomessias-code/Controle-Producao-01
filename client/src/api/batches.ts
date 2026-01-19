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
  birthDate?: string;
  cageId?: string;
  status: "active" | "inactive" | "sold";
  phase?: "caricoto" | "crescimento" | "postura" | "machos" | "reprodutoras";
  originId?: string;
  notes?: string;
  history?: HistoryEvent[];
  createdAt: string;
  updatedAt: string;
  // Extra fields from Lotes table mapping
  galpao_id?: string;
  gaiola_name?: string;
  galpao_name?: string;
  aviary_name?: string;
  aviary_city?: string;
  aviaryId?: string; // Mapped for filtering
  males?: number;
  females?: number;
  parentId?: string;
  location?: string;
  meta_mortalidade?: number;
  meta_producao_diaria?: number;
  categoryId?: string;
}

export interface CreateBatchRequest {
  name: string;
  species: string;
  quantity: number;
  cageId?: string;
  phase?: "caricoto" | "crescimento" | "postura" | "machos" | "reprodutoras";
  originId?: string;
  birthDate?: string;
  notes?: string;
  history?: HistoryEvent[];
  males?: number;
  females?: number;
  parentId?: string;
  meta_mortalidade?: number;
  meta_producao_diaria?: number;
  location?: string;
  categoryId?: string;
}

export interface UpdateBatchRequest extends Partial<CreateBatchRequest> {
  status?: "active" | "inactive" | "sold";
}

// Map Backend 'Lote' to Frontend 'Batch'
const calculatePhase = (dateString: string): "caricoto" | "crescimento" | "postura" => {
  if (!dateString) return "crescimento";
  const start = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 21) return "caricoto"; // Or "Inicial"
  if (diffDays < 42) return "crescimento";
  return "postura";
};

const mapLoteToBatch = (lote: any): Batch => {
  return {
    id: lote.id,
    name: lote.name,
    species: lote.linhagem || "Codornas Japonesas",
    quantity: lote.quantidade,
    birthDate: lote.data_nascimento,
    cageId: lote.gaiola_id || lote.caixa_id,
    status: lote.status === 'ativo' ? 'active' : 'inactive',
    phase: lote.fase,
    notes: lote.observacoes || "",
    originId: lote.origem_id,
    createdAt: lote.created_at,
    updatedAt: lote.updated_at,
    galpao_id: lote.galpao_id,
    gaiola_name: lote.gaiolas?.nome || lote.caixas_crescimento?.nome,
    galpao_name: lote.galpoes?.nome,
    aviary_name: lote.caixas_crescimento?.aviarios?.nome || lote.galpoes?.aviarios?.nome,
    aviary_city: lote.caixas_crescimento?.aviarios?.cidade || lote.galpoes?.aviarios?.cidade,
    aviaryId: lote.caixas_crescimento?.aviario_id || lote.galpoes?.aviario_id,
    males: lote.males || 0,
    females: lote.females || 0,
    parentId: lote.parent_id,
    location: lote.gaiolas?.nome || lote.caixas_crescimento?.nome || "Sem Local",
    meta_mortalidade: lote.meta_mortalidade,
    meta_producao_diaria: lote.meta_producao_diaria,
    categoryId: lote.category_id
  };
};

export const batchesApi = {
  getAll: async (): Promise<Batch[]> => {
    try {
      // Fetch all lotes, assuming we want to filter by Growth/Crescimento context usually?
      // Or we just fetch all and let frontend filter.
      const lotes = await supabaseClient.get<any[]>("/lotes");
      if (!Array.isArray(lotes)) {
        console.error("API returned non-array for batches:", lotes);
        return [];
      }
      return lotes.map(mapLoteToBatch);
    } catch (error) {
      console.error("Error fetching batches:", error);
      return [];
    }
  },

  getById: async (id: string): Promise<Batch> => {
    const lote = await supabaseClient.get<any>(`/lotes/${id}`);
    return mapLoteToBatch(lote);
  },

  getByCageId: async (cageId: string): Promise<Batch[]> => {
    const lotes = await supabaseClient.get<any[]>(`/lotes?gaiola_id=${cageId}`);
    return lotes.map(mapLoteToBatch);
  },

  create: async (data: CreateBatchRequest): Promise<Batch> => {
    // Map Frontend 'Batch' to Backend 'Lote'
    const payload = {
      name: data.name,
      linhagem: data.species,
      quantidade: data.quantity,
      data_nascimento: data.birthDate || new Date().toISOString(),
      gaiola_id: data.cageId, // MUST be a UUID
      status: 'ativo',
      fase: data.phase,
      origem_id: data.originId,
      observacoes: data.notes,
      males: data.males || 0,
      females: data.females || 0,
      parent_id: data.parentId,
      meta_mortalidade: data.meta_mortalidade,
      meta_producao_diaria: data.meta_producao_diaria
      // history: data.history // If DB supports it
    };

    // If cageId is provided, we should probably try to get the galpao_id from the cage first
    // But for now let's hope the backend handles it or we send it if we knew it.
    // The current LotesController.criar just inserts what we send.

    const newLote = await supabaseClient.post<any>("/lotes", payload);
    return mapLoteToBatch(newLote);
  },

  update: async (id: string, data: UpdateBatchRequest): Promise<Batch> => {
    const payload: any = {};
    if (data.name) payload.name = data.name;
    if (data.quantity !== undefined) payload.quantidade = data.quantity; // Allow 0
    if (data.status) payload.status = data.status === 'active' ? 'ativo' : 'finalizado';
    if (data.notes) payload.observacoes = data.notes;
    if (data.cageId) payload.gaiola_id = data.cageId;
    if (data.males !== undefined) payload.males = data.males;
    if (data.females !== undefined) payload.females = data.females;
    if (data.parentId) payload.parent_id = data.parentId;
    if (data.meta_mortalidade !== undefined) payload.meta_mortalidade = data.meta_mortalidade;
    if (data.meta_producao_diaria !== undefined) payload.meta_producao_diaria = data.meta_producao_diaria;

    // History is complex. If backend has no history column, we can't save it directly.
    // Ideally we append to notes or use audit_logs. For now, we enable notes to allow saving transfer summaries.

    // Also trim ID to be safe
    const cleanId = id.trim();

    const updated = await supabaseClient.put<any>(`/lotes/${cleanId}`, payload);
    return mapLoteToBatch(updated);
  },

  delete: async (id: string): Promise<void> => {
    await supabaseClient.delete(`/lotes/${id}`);
  },

  generateQRCode: async (batchId: string): Promise<string> => {
    return `BATCH-${batchId}`;
  },
};
