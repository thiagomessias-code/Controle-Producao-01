import { supabaseClient } from "./supabaseClient";

export interface Feed {
  id: string;
  groupId: string;
  cageId?: string;
  date: string;
  quantity: number;
  type: string;
  cost?: number;
  supplier?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeedRequest {
  groupId: string;
  cageId?: string;
  date: string;
  quantity: number;
  type: string;
  cost?: number;
  supplier?: string;
  notes?: string;
}

export interface UpdateFeedRequest extends Partial<CreateFeedRequest> { }

export const feedApi = {
  getByGroupId: async (groupId: string): Promise<Feed[]> => {
    return supabaseClient.get(`/groups/${groupId}/feed`);
  },

  getAll: async (): Promise<Feed[]> => {
    return supabaseClient.get("/feed");
  },

  getById: async (id: string): Promise<Feed> => {
    return supabaseClient.get(`/feed/${id}`);
  },

  create: async (data: CreateFeedRequest): Promise<Feed> => {
    return supabaseClient.post("/feed", data);
  },

  update: async (id: string, data: UpdateFeedRequest): Promise<Feed> => {
    return supabaseClient.put(`/feed/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    return supabaseClient.delete(`/feed/${id}`);
  },

  getFeedStats: async (groupId: string): Promise<{
    totalQuantity: number;
    totalCost: number;
    averageDailyConsumption: number;
  }> => {
    return supabaseClient.get(`/groups/${groupId}/feed/stats`);
  },
};
