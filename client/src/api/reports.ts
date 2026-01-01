
import { supabase } from '@/api/supabaseClient';

// Use same host as the rest of the app, assuming backend runs on 3000
const API_URL = import.meta.env.VITE_API_URL || '/api';

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
    data: string;
    graficos: Graphics[];
    insights: string[];
    alertas: any[];
}

export const reportsApi = {
    getLatest: async (aviaryId?: string): Promise<Report | null> => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
        const url = aviaryId ? `${API_URL}/reports/latest?aviaryId=${aviaryId}` : `${API_URL}/reports/latest`;
        const res = await fetch(url, { headers });
        if (!res.ok) return null;
        return res.json();
    },

    analyze: async (aviaryId?: string): Promise<Report> => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
        const url = aviaryId ? `${API_URL}/reports/analyze?aviaryId=${aviaryId}` : `${API_URL}/reports/analyze`;
        const res = await fetch(url, {
            method: 'POST',
            headers
        });
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || 'Analysis failed');
        }
        return res.json();
    },

    chat: async (message: string, context: any[]) => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
        const res = await fetch(`${API_URL}/reports/chat`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ message, context })
        });
        if (!res.ok) throw new Error('Chat failed');
        return res.json();
    },

    getHistoricalData: async (type: 'lote' | 'gaiola', id: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
        const res = await fetch(`${API_URL}/reports/history?type=${type}&id=${id}`, { headers });
        if (!res.ok) throw new Error('Failed to fetch history');
        return res.json();
    }
};
