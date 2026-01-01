import React, { useEffect, useState } from 'react';
import { supabaseClient } from '@/api/supabaseClient';
import { aviariesApi } from '@/api/aviaries';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import FinancialDashboard from '@/pages/Financial/FinancialDashboard';

export const AdminFinancial: React.FC = () => {
    // Tab State: 'dashboard' | 'settings'
    const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>('dashboard');

    // Settings State
    const [configs, setConfigs] = useState<any[]>([]);
    const [values, setValues] = useState<Record<string, string>>({});

    // Aviary Selection for Filter
    const [selectedAviaryId, setSelectedAviaryId] = useState<string>('');
    const [aviaries, setAviaries] = useState<any[]>([]);

    useEffect(() => {
        // Fetch Aviaries for the filter
        aviariesApi.getAll().then(setAviaries).catch(console.error);
    }, []);

    useEffect(() => {
        if (activeTab === 'settings') {
            fetchConfigs();
        }
    }, [activeTab]);

    const fetchConfigs = async () => {
        try {
            const data = await supabaseClient.get('/configuracoes');
            setConfigs(data);
            const initialValues: any = {};
            data.forEach((c: any) => initialValues[c.chave] = c.valor);
            setValues(initialValues);
        } catch (error) {
            console.error('Erro ao buscar configurações:', error);
        }
    };

    const handleSave = async () => {
        try {
            const updates = Object.keys(values).map(key => ({
                chave: key,
                valor: values[key]
            }));

            await supabaseClient.put('/configuracoes/batch', { configs: updates });
            alert('Configurações salvas!');
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Financeiro & Custos</h1>
                    <p className="text-gray-500 mt-1">Acompanhe métricas financeiras e configure custos de produção.</p>

                    {/* AVIARY SELECTOR */}
                    <div className="w-full md:w-64">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                            Filtrar por Aviário
                        </label>
                        <select
                            className="w-full h-10 border rounded-xl px-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all text-sm"
                            value={selectedAviaryId}
                            onChange={(e) => setSelectedAviaryId(e.target.value)}
                        >
                            <option value="">Todos os Aviários</option>
                            {aviaries.map(av => (
                                <option key={av.id} value={av.id}>{av.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm ${activeTab === 'dashboard'
                                ? 'bg-white text-blue-600 shadow-md'
                                : 'text-gray-500 hover:text-gray-900 shadow-none hover:bg-gray-200/50'
                                }`}
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm ${activeTab === 'settings'
                                ? 'bg-white text-blue-600 shadow-md'
                                : 'text-gray-500 hover:text-gray-900 shadow-none hover:bg-gray-200/50'
                                }`}
                        >
                            Configurações
                        </button>
                    </div>
                </div>
            </div>

            {activeTab === 'dashboard' ? (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-h-[500px]">
                    <FinancialDashboard selectedAviaryId={selectedAviaryId || undefined} />
                </div>
            ) : (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                    <div className="flex justify-end">
                        <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white px-8 shadow-md hover:shadow-lg transition-all">
                            Salvar Configurações
                        </Button>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="border-none shadow-md hover:shadow-lg transition-all">
                            <CardHeader>
                                <CardTitle className="text-blue-700">Preços de Venda</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div>
                                    <Label className="text-gray-600">Preço Ovo (Dúzia/Un)</Label>
                                    <Input
                                        className="mt-1"
                                        value={values['financeiro.preco_ovo'] || ''}
                                        onChange={(e) => setValues({ ...values, 'financeiro.preco_ovo': e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label className="text-gray-600">Preço Ave Abatida (Kg/Un)</Label>
                                    <Input
                                        className="mt-1"
                                        value={values['financeiro.preco_ave_abatida'] || ''}
                                        onChange={(e) => setValues({ ...values, 'financeiro.preco_ave_abatida': e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label className="text-gray-600">Preço Pintinho</Label>
                                    <Input
                                        className="mt-1"
                                        value={values['financeiro.preco_pintinho'] || ''}
                                        onChange={(e) => setValues({ ...values, 'financeiro.preco_pintinho': e.target.value })}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-md hover:shadow-lg transition-all">
                            <CardHeader>
                                <CardTitle className="text-orange-700">Custos de Produção (Ração)</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div>
                                    <Label className="text-gray-600">Custo Ração Inicial (kg)</Label>
                                    <Input
                                        className="mt-1"
                                        value={values['financeiro.custo_racao_inicial'] || ''}
                                        onChange={(e) => setValues({ ...values, 'financeiro.custo_racao_inicial': e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label className="text-gray-600">Custo Ração Crescimento (kg)</Label>
                                    <Input
                                        className="mt-1"
                                        value={values['financeiro.custo_racao_crescimento'] || ''}
                                        onChange={(e) => setValues({ ...values, 'financeiro.custo_racao_crescimento': e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label className="text-gray-600">Custo Ração Postura (kg)</Label>
                                    <Input
                                        className="mt-1"
                                        value={values['financeiro.custo_racao_postura'] || ''}
                                        onChange={(e) => setValues({ ...values, 'financeiro.custo_racao_postura': e.target.value })}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};
