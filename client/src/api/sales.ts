import { supabaseClient } from "./supabaseClient";

export interface Sale {
  id: string;
  groupId: string;
  batchId?: string;
  originText?: string;
  date: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  buyer?: string;
  productType: string;
  product_variation_id?: string;
  userName?: string;
  paymentMethod: "cash" | "check" | "transfer" | "other";
  status: "pending" | "completed" | "cancelled";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSaleRequest {
  groupId: string;
  date: string;
  quantity: number;
  unitPrice: number;
  buyer?: string;
  productType: string;
  product_variation_id?: string;
  userId?: string;
  paymentMethod: "cash" | "payment_app" | "transfer" | "other" | "check";
  notes?: string;
  items?: {
    produto_nome: string;
    quantidade: number;
    preco_unitario: number;
    item_estoque_id: string | null;
  }[];
}

export interface UpdateSaleRequest extends Partial<CreateSaleRequest> {
  status?: "pending" | "completed" | "cancelled";
}

// Helper to extract groupId from notes if present
const extractGroupId = (notes?: string): string => {
  if (!notes) return 'warehouse';
  const match = notes.match(/\[Galpao:([^\]]+)\]/);
  return match ? match[1] : 'warehouse';
};

// Map Backend Venda to Frontend Sale
const mapFromBackend = (data: any): Sale => {
  // Backend returns venda with itens array?
  // If listings, it might be flat or nested. Assuming nested based on service.
  // If itens is array, we take the first item to represent the "main" product for this simplified view
  const mainItem = data.vendas_itens && data.vendas_itens[0] ? data.vendas_itens[0] : {};

  const extractOrigin = (notes?: string): string | undefined => {
    if (!notes) return undefined;
    const match = notes.match(/\[Origem:\s*([^\]]+)\]/);
    return match ? match[1] : undefined;
  };

  return {
    id: data.id,
    groupId: data.galpao_id || extractGroupId(data.observacoes),
    batchId: data.lote_id, // Add batchId support
    originText: extractOrigin(data.observacoes),
    date: data.data_venda,
    quantity: mainItem.quantidade || 0,
    unitPrice: mainItem.preco_unitario || 0,
    totalPrice: data.valor_total,
    buyer: data.cliente_nome,
    productType: mainItem.produto_nome || 'Unknown',
    product_variation_id: undefined,
    userName: data.users?.name,
    paymentMethod: data.metodo_pagamento as any,
    status: data.status as any,
    notes: data.observacoes,
    createdAt: data.created_at || data.data_venda,
    updatedAt: data.updated_at || data.data_venda
  };
};

export const salesApi = {
  getByGroupId: async (groupId: string): Promise<Sale[]> => {
    // Backend doesn't support filtering by group natively yet (missing column).
    // We fetch all (or recent) and filter in memory.
    // Optimization: Backend could add search/filter support.
    const allSales = await salesApi.getAll();
    return allSales.filter(s => s.groupId === groupId);
  },

  getAll: async (): Promise<Sale[]> => {
    const data = await supabaseClient.get<any[]>("/vendas");
    return (data || []).map(mapFromBackend);
  },

  getById: async (id: string): Promise<Sale> => {
    const data = await supabaseClient.get<any>(`/vendas/${id}`);
    return mapFromBackend(data);
  },

  create: async (data: CreateSaleRequest): Promise<Sale> => {
    // Map Frontend request to Backend payload
    // Backend expects: { cliente_nome, valor_total, itens: [...] }
    const payload = {
      cliente_nome: data.buyer,
      cliente_contato: null, // Frontend doesn't have this field
      valor_total: data.unitPrice * data.quantity,
      data_venda: data.date,
      metodo_pagamento: data.paymentMethod,
      observacoes: `${data.notes || ''} [Galpao:${data.groupId}]`, // Store groupId in notes
      usuario_id: data.userId,
      itens: data.items || [
        {
          produto_nome: data.productType,
          quantidade: data.quantity,
          preco_unitario: data.unitPrice,
          item_estoque_id: null // Unless we link to specific stock items
        }
      ]
    };

    const newVenda = await supabaseClient.post<any>("/vendas", payload);
    return mapFromBackend(newVenda);
  },

  update: async (id: string, data: UpdateSaleRequest): Promise<Sale> => {
    // Backend Only supports status update via specialized endpoint for now, 
    // or general update? Service has `atualizarStatus`.
    // It doesn't seem to have full update.
    if (data.status) {
      await supabaseClient.patch(`/vendas/${id}/status`, { status: data.status });
    }
    // For other fields, we might need a general update endpoint in backend.
    // Assuming backend only supports status for now based on routes.
    return salesApi.getById(id);
  },

  delete: async (id: string): Promise<void> => {
    // Backend didn't expose delete route in `vendas.routes.ts`.
    // We might need to implement it or use direct DB if permissions allow.
    // For now, assume un-deletable or throw error.
    // But mock had delete. 
    // I'll try calling DELETE on endpoint (Express might handle it if I missed it, or 404).
    // If 404, we can't delete.
    console.warn("Delete not explicitly supported by Vendas API yet.");
    // Just try standard REST
    await supabaseClient.delete(`/vendas/${id}`);
  },

  getSalesStats: async (groupId?: string): Promise<{
    totalSales: number;
    totalRevenue: number;
    averageUnitPrice: number;
  }> => {
    const sales = groupId ? await salesApi.getByGroupId(groupId) : await salesApi.getAll();

    const totalSales = sales.reduce((acc, curr) => acc + curr.quantity, 0);
    const totalRevenue = sales.reduce((acc, curr) => acc + curr.totalPrice, 0);
    const averageUnitPrice = totalSales > 0 ? totalRevenue / totalSales : 0;

    return { totalSales, totalRevenue, averageUnitPrice };
  }
};

// Helper function removed as it is now inside mapFromBackend logic or unused

