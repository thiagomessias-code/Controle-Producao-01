import { supabase } from "./supabaseClient";

export interface FeedType {
  id: string;
  name: string;
  phase: string;
  preco_kg: number;
  price_per_kg: number; // Mandatory frontend alias
  estoque_atual: number;
  supplier_default?: string;
  active: boolean;
  capacidade_silo: number;
  cor_silo: string;
}

export interface FeedSchedule {
  id: string;
  phase: string;
  time: string;
  active: boolean;
}

export interface FeedConsumption {
  id: string;
  groupId: string;
  cageId?: string;
  batchId?: string;
  date: string;
  quantity: number;
  feedTypeId?: string;
  feedTypeName?: string; // Snapshot
  notes?: string;
  createdAt: string;
  executedAt?: string;
  scheduledTime?: string;
}

export interface FeedConfiguration {
  id: string;
  group_type: string;
  feed_type_id: string;
  quantity_per_cage: number;
  schedule_times: string[]; // JSON array of strings
  active: boolean;
  // Optional join fields
  feed_types?: {
    name: string;
    phase: string;
  };
}

export interface CreateFeedRequest {
  groupId: string;
  cageId?: string;
  batchId?: string;
  date: string;
  quantity: number;
  feedTypeId?: string;
  feedTypeName: string; // Required now as fallback or snapshot
  cost?: number; // Ignored if using feedType price, but kept for interface
  supplier?: string;
  notes?: string;
  userId?: string;
  executedAt?: string;
  scheduledTime?: string;
}

export interface UpdateFeedRequest extends Partial<CreateFeedRequest> { }

export const feedApi = {
  // --- Feed Types (Rações) ---
  getFeedTypes: async (): Promise<FeedType[]> => {
    const { data, error } = await supabase
      .from('feed_types')
      .select('*')
      .eq('active', true)
      .order('name');
    if (error) throw error;
    // Map preco_kg if the backend returned price_per_kg or vice versa
    return (data || []).map(f => ({
      ...f,
      price_per_kg: f.preco_kg || f.price_per_kg || 0,
      estoque_atual: f.estoque_atual || 0,
      capacidade_silo: f.capacidade_silo || 1000,
      cor_silo: f.cor_silo || '#3b82f6'
    }));
  },

  createFeedType: async (feed: Partial<FeedType>): Promise<FeedType> => {
    const { data, error } = await supabase.from('feed_types').insert(feed).select().single();
    if (error) throw error;
    return data;
  },

  updateFeedType: async (id: string, feed: Partial<FeedType>): Promise<FeedType> => {
    const { data, error } = await supabase.from('feed_types').update(feed).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  deleteFeedType: async (id: string): Promise<void> => {
    const { error } = await supabase.from('feed_types').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Feed Schedules (Horários) ---
  getSchedules: async (): Promise<FeedSchedule[]> => {
    const { data, error } = await supabase
      .from('feed_schedules')
      .select('*')
      .eq('active', true)
      .order('time');
    if (error) throw error;
    return data || [];
  },

  createSchedule: async (schedule: Partial<FeedSchedule>): Promise<FeedSchedule> => {
    const { data, error } = await supabase.from('feed_schedules').insert(schedule).select().single();
    if (error) throw error;
    return data;
  },

  deleteSchedule: async (id: string): Promise<void> => {
    const { error } = await supabase.from('feed_schedules').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Feed Configurations (Configuração por Tipo de Grupo) ---
  getConfigurations: async (): Promise<FeedConfiguration[]> => {
    const { data, error } = await supabase
      .from('feed_configurations')
      .select('*');
    if (error) throw error;

    // Flatten the joined feed name for easier frontend use if needed, 
    // or just return as is.
    return data || [];
  },

  upsertConfiguration: async (config: Partial<FeedConfiguration>): Promise<FeedConfiguration> => {
    // Sanitize input: ensure empty strings are null for UUID fields
    const sanitizedConfig = { ...config };
    if (sanitizedConfig.feed_type_id === '') {
      sanitizedConfig.feed_type_id = null as any;
    }

    // Remove joined data which is not a column
    delete (sanitizedConfig as any).feed_types;

    const { data, error } = await supabase
      .from('feed_configurations')
      .upsert(sanitizedConfig, { onConflict: 'group_type' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // --- Consumption (Consumo) ---
  getByGroupId: async (groupId: string): Promise<FeedConsumption[]> => {
    console.log("DEBUG: feedApi.getByGroupId called with:", groupId);
    const { data, error } = await supabase
      .from('feed_consumption')
      .select('*')
      .or(`galpao_id.eq.${groupId},lote_id.eq.${groupId},gaiola_id.eq.${groupId}`)
      .order('data_consumo', { ascending: false });

    if (error) {
      console.error("DEBUG: feedApi.getByGroupId error:", error);
      throw error;
    }
    console.log(`DEBUG: feedApi.getByGroupId returned ${data?.length || 0} records for ${groupId}`);
    return (data || []).map(mapConsumptionToFrontend);
  },

  getByBatchId: async (batchId: string): Promise<FeedConsumption[]> => {
    console.log("DEBUG: feedApi.getByBatchId called with:", batchId);
    const { data, error } = await supabase
      .from('feed_consumption')
      .select('*')
      .eq('lote_id', batchId)
      .order('data_consumo', { ascending: false });

    if (error) {
      console.error("DEBUG: feedApi.getByBatchId error:", error);
      throw error;
    }
    console.log(`DEBUG: feedApi.getByBatchId returned ${data?.length || 0} records for ${batchId}`);
    return (data || []).map(mapConsumptionToFrontend);
  },

  getAll: async (): Promise<FeedConsumption[]> => {
    // Explicitly select all to ensure no RLS hidden columns issue
    const { data, error } = await supabase
      .from('feed_consumption')
      .select('*')
      .order('data_consumo', { ascending: false });

    if (error) {
      console.error("Error in feedApi.getAll:", error);
      throw error;
    }

    console.log(`DEBUG: feedApi.getAll returned ${data?.length || 0} records`);
    return (data || []).map(mapConsumptionToFrontend);
  },

  create: async (data: CreateFeedRequest): Promise<FeedConsumption> => {
    const backendData = {
      galpao_id: data.groupId || null,
      gaiola_id: data.cageId || null,
      lote_id: data.batchId || null,
      data_consumo: data.date,
      quantidade_kg: data.quantity,
      feed_type_id: data.feedTypeId || null,
      feed_type_name: data.feedTypeName,
      observacoes: data.notes
      // user_id, executed_at, scheduled_time removed as they are missing from schema
    };

    console.log("DEBUG: feedApi.create - sending payload:", backendData);

    const { data: created, error } = await supabase
      .from('feed_consumption')
      .insert(backendData)
      .select()
      .single();

    if (error) {
      console.error("DEBUG: feedApi.create - ERROR response:", error);
      throw error;
    }

    console.log("DEBUG: feedApi.create - SUCCESS response:", created);
    return mapConsumptionToFrontend(created);
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('feed_consumption').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Stock Management ---
  resupply: async (id: string, quantity: number, userId: string): Promise<void> => {
    // Try using the RPC function first
    const { error } = await supabase.rpc('abastecer_racao', {
      p_racao_id: id,
      p_quantidade: quantity,
      p_usuario_id: userId
    });

    if (error) {
      console.error("RPC abastecer_racao failed, falling back to manual: ", error);
      // Fallback: Manual update (not transactional)
      const { data: current } = await supabase.from('feed_types').select('estoque_atual').eq('id', id).single();
      const newStock = (current?.estoque_atual || 0) + quantity;

      const { error: upError } = await supabase.from('feed_types').update({ estoque_atual: newStock }).eq('id', id);
      if (upError) throw upError;

      const { error: histError } = await supabase.from('historico_abastecimento').insert({
        racao_id: id,
        quantidade_adicionada: quantity,
        usuario_id: userId
      });
      if (histError) throw histError;
    }
  },

  getResupplyHistory: async (racaoId?: string): Promise<any[]> => {
    let query = supabase.from('historico_abastecimento').select(`
      *,
      users ( name )
    `).order('data_abastecimento', { ascending: false });

    if (racaoId) {
      query = query.eq('racao_id', racaoId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Legacy Stat stub (can be implemented with RPC later)
  getFeedStats: async (groupId: string): Promise<any> => {
    return { totalQuantity: 0, totalCost: 0, averageDailyConsumption: 0 };
  }
};

function mapConsumptionToFrontend(data: any): FeedConsumption {
  return {
    id: data.id,
    groupId: data.galpao_id,
    cageId: data.gaiola_id,
    batchId: data.lote_id,
    date: data.data_consumo,
    quantity: data.quantidade_kg,
    feedTypeId: data.feed_type_id,
    feedTypeName: data.feed_type_name,
    notes: data.observacoes,
    createdAt: data.created_at,
    executedAt: data.created_at,
    scheduledTime: data.observacoes?.match(/Horário: (\d{2}:\d{2})/)?.[1]
  };
}
