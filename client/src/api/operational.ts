import { supabaseClient } from "./supabaseClient";

export interface OperationalCost {
    id: string;
    categoria: 'energia' | 'agua' | 'mao_de_obra' | 'manutencao' | 'investimento' | 'outros';
    descricao: string;
    valor: number;
    data_referencia: string;
    aviario_id?: string;
    createdAt: string;
}

export interface EnvironmentalCondition {
    id: string;
    galpao_id?: string;
    gaiola_id?: string;
    temperatura?: number;
    umidade?: number;
    amonia?: number;
    data_leitura: string;
    observacoes?: string;
}

export const operationalApi = {
    costs: {
        getAll: (aviaryId?: string) =>
            supabaseClient.get<OperationalCost[]>(aviaryId ? `/custos_operacionais?aviario_id=${aviaryId}` : '/custos_operacionais'),
        create: (data: Omit<OperationalCost, 'id' | 'createdAt'>) =>
            supabaseClient.post<OperationalCost>('/custos_operacionais', data),
        delete: (id: string) => supabaseClient.delete(`/custos_operacionais/${id}`)
    },
    environmental: {
        getByLocation: (type: 'galpao' | 'gaiola', id: string) =>
            supabaseClient.get<EnvironmentalCondition[]>(`/condicoes_ambientais?${type}_id=${id}`),
        create: (data: Omit<EnvironmentalCondition, 'id'>) =>
            supabaseClient.post<EnvironmentalCondition>('/condicoes_ambientais', data)
    }
};
