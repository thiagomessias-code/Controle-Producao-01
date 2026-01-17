
import { supabaseClient } from '@/api/supabaseClient';

export interface Graphics {
    id: string;
    chartType: 'line' | 'bar' | 'pie';
    title: string;
    data: any[];
    insight: string;
    alert?: boolean;
}

export interface Report {
    id: string;
    created_at: string;
    graficos: Graphics[];
    insights: string[];
    alertas: any[];
    financial?: any;
    genetics?: any;
}

export const reportsApi = {
    getLatest: async (aviaryId?: string): Promise<Report | null> => {
        const url = aviaryId ? `/reports/latest?aviaryId=${aviaryId}` : `/reports/latest`;
        try {
            return await supabaseClient.get(url);
        } catch (error) {
            return null;
        }
    },

    analyze: async (aviaryId?: string): Promise<Report> => {
        const url = aviaryId ? `/reports/analyze?aviaryId=${aviaryId}` : `/reports/analyze`;
        // Explicitly use the Axios instance which should have a longer timeout if needed, 
        // but here we just benefit from standard config and better error handling.
        return await supabaseClient.post(url, {});
    },

    chat: async (message: string, context: any[]) => {
        return await supabaseClient.post(`/reports/chat`, { message, context });
    },

    getHistoricalData: async (type: 'lote' | 'gaiola', id: string) => {
        return await supabaseClient.get(`/reports/history?type=${type}&id=${id}`);
    }
};
