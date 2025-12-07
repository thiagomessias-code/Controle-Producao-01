import axios, { AxiosInstance } from "axios";

// Mock Supabase client - em produção, integre com Supabase real
// src/api/supabaseClient.ts
export class FakeClient {
  private getStorageKey(url: string): string {
    if (url.includes("/production")) return "mock_production";
    if (url.includes("/sales")) return "mock_sales";
    if (url.includes("/incubation")) return "mock_incubation";
    if (url.includes("/mortality")) return "mock_mortality";
    if (url.includes("/feed")) return "mock_feed";
    if (url.includes("/cages")) return "mock_cages";
    if (url.includes("/warehouse")) return "mock_warehouse_v2";
    return "mock_groups";
  }

  private load(key: string): any[] {
    const data = localStorage.getItem(key);
    let items: any[] = [];

    try {
      items = data ? JSON.parse(data) : [];
    } catch {
      items = [];
    }

    // Auto-seed Warehouse for demo purposes if empty
    if (key === "mock_warehouse_v2" && items.length === 0) {
      const today = new Date();
      const lastWeek = new Date(today); lastWeek.setDate(today.getDate() - 7);
      const old = new Date(today); old.setDate(today.getDate() - 25);

      const defaultData = [
        {
          id: "demo-egg-1",
          type: "egg",
          subtype: "ovo cru",
          quantity: 500,
          origin: { groupId: "demo-g1", batchId: "BATCH-001", date: lastWeek.toISOString() },
          createdAt: lastWeek.toISOString(),
          expirationDate: new Date(lastWeek.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: "in_stock",
          history: [{ date: lastWeek.toISOString(), action: "entry", quantity: 500, details: "Estoque Inicial (Demo)" }]
        },
        {
          id: "demo-egg-2",
          type: "egg",
          subtype: "ovo cru",
          quantity: 300,
          origin: { groupId: "demo-g2", batchId: "BATCH-002", date: old.toISOString() },
          createdAt: old.toISOString(),
          expirationDate: new Date(old.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: "in_stock",
          history: [{ date: old.toISOString(), action: "entry", quantity: 300, details: "Estoque Inicial (Demo)" }]
        },
        {
          id: "demo-meat-1",
          type: "meat",
          subtype: "codorna abatida",
          quantity: 100,
          origin: { groupId: "demo-g3", batchId: "BATCH-003", date: today.toISOString() },
          createdAt: today.toISOString(),
          expirationDate: new Date(today.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString(),
          status: "in_stock",
          history: [{ date: today.toISOString(), action: "entry", quantity: 100, details: "Estoque Inicial (Demo)" }]
        }
      ];
      this.save(key, defaultData);
      return defaultData;
    }

    return items;
  }

  private save(key: string, data: any[]) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  async get<T = any>(url: string): Promise<T> {
    // Handle specific stats endpoints
    if (url.endsWith("/stats")) {
      return {
        totalQuantity: 0,
        totalWeight: 0,
        averageQuality: "A",
        totalSales: 0,
        totalRevenue: 0,
        averageUnitPrice: 0
      } as unknown as T;
    }

    // Handle QRCode
    if (url.endsWith("/qrcode")) {
      return "mock-qr-code" as unknown as T;
    }

    const key = this.getStorageKey(url);
    const items = this.load(key);

    // Filter by Group ID if present in URL
    // Format: /groups/:groupId/entity
    const groupMatch = url.match(/\/groups\/([^\/]+)\/([^\/]+)/);
    if (groupMatch && !url.endsWith("/stats")) {
      const [, groupId, entity] = groupMatch;
      // If entity is the main resource being requested
      if (["production", "sales", "incubation", "mortality", "feed"].includes(entity)) {
        return items.filter((item: any) => item.groupId === groupId) as unknown as T;
      }
    }

    // Get All
    if (url === "/groups" || url === "/production" || url === "/sales" || url === "/incubation" || url === "/mortality" || url === "/feed" || url === "/cages" || url === "/warehouse") {
      return items as unknown as T;
    }

    // Get by ID
    // Assumes URL ends with ID if it's not one of the above
    const id = url.split("/").pop();
    if (id) {
      const item = items.find((i: any) => i.id === id);
      return (item || null) as unknown as T;
    }

    return [] as unknown as T;
  }

  async post<T = any>(url: string, data: any): Promise<T> {
    const key = this.getStorageKey(url);
    const items = this.load(key);

    const newItem = {
      id: crypto.randomUUID?.() ?? Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "active", // Default status
      phase: "caricoto", // Default phase
      ...data,
    };

    items.push(newItem);
    this.save(key, items);

    return newItem as unknown as T;
  }

  async put<T = any>(url: string, data: any): Promise<T> {
    const key = this.getStorageKey(url);
    const items = this.load(key);
    const id = url.split("/").pop();
    const index = items.findIndex((i: any) => i.id === id);

    if (index === -1) return null as unknown as T;

    items[index] = {
      ...items[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    this.save(key, items);
    return items[index] as unknown as T;
  }

  async delete<T = any>(url: string): Promise<T> {
    const key = this.getStorageKey(url);
    const items = this.load(key);
    const id = url.split("/").pop();
    const filtered = items.filter((i: any) => i.id !== id);
    this.save(key, filtered);
    return { success: true } as unknown as T;
  }
}

export const supabaseClient = new FakeClient();
export default supabaseClient;
