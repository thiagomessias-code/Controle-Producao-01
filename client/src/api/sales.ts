import { supabaseClient } from "./supabaseClient";

export interface Sale {
  id: string;
  groupId: string;
  date: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  buyer?: string;
  productType: "ovo cru" | "codorna abatida" | "codorna adulta" | "codorna pinto" | "ovo em conserva" | "ovo galado" | "churrasco codorna";
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
  productType: "ovo cru" | "codorna abatida" | "codorna adulta" | "codorna pinto" | "ovo em conserva" | "ovo galado" | "churrasco codorna";
  paymentMethod: "cash" | "check" | "transfer" | "other";
  notes?: string;
}

export interface UpdateSaleRequest extends Partial<CreateSaleRequest> {
  status?: "pending" | "completed" | "cancelled";
}

export const salesApi = {
  getByGroupId: async (groupId: string): Promise<Sale[]> => {
    return supabaseClient.get(`/groups/${groupId}/sales`);
  },

  getAll: async (): Promise<Sale[]> => {
    return supabaseClient.get("/sales");
  },

  getById: async (id: string): Promise<Sale> => {
    return supabaseClient.get(`/sales/${id}`);
  },

  create: async (data: CreateSaleRequest): Promise<Sale> => {
    return supabaseClient.post("/sales", data);
  },

  update: async (id: string, data: UpdateSaleRequest): Promise<Sale> => {
    return supabaseClient.put(`/sales/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    return supabaseClient.delete(`/sales/${id}`);
  },

  getSalesStats: async (groupId?: string): Promise<{
    totalSales: number;
    totalRevenue: number;
    averageUnitPrice: number;
  }> => {
    const url = groupId ? `/groups/${groupId}/sales/stats` : "/sales/stats";
    return supabaseClient.get(url);
  },
};
