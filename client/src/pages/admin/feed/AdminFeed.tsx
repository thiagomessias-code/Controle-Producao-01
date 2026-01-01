import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingBag, Plus, Trash2, Edit, Save, Settings } from 'lucide-react';
import { feedApi, FeedType, FeedConfiguration, FeedConsumption } from '@/api/feed';
import Input from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency } from "@/utils/format";
import { useAuth } from '@/hooks/useAuth';

export const AdminFeed: React.FC = () => {
    const { user } = useAuth();
    const [feedTypes, setFeedTypes] = useState<FeedType[]>([]);
    const [configurations, setConfigurations] = useState<FeedConfiguration[]>([]);
    const [feedHistory, setFeedHistory] = useState<FeedConsumption[]>([]);
    const [resupplyHistory, setResupplyHistory] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [cages, setCages] = useState<any[]>([]);
    const [growthBoxes, setGrowthBoxes] = useState<any[]>([]);
    const [aviaries, setAviaries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Dialog & Form State
    const [isFeedDialogOpen, setIsFeedDialogOpen] = useState(false);
    const [isResupplyDialogOpen, setIsResupplyDialogOpen] = useState(false);
    const [editingFeed, setEditingFeed] = useState<FeedType | null>(null);

    const [feedForm, setFeedForm] = useState<Partial<FeedType>>({
        name: '', phase: 'postura', price_per_kg: 0, supplier_default: '', active: true
    });

    const [resupplyForm, setResupplyForm] = useState({
        quantity: 0,
        feedId: '',
        feedName: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [types, configs, history, rHistory, allGroups, allCages, boxes, allAviaries] = await Promise.all([
                feedApi.getFeedTypes(),
                feedApi.getConfigurations(),
                feedApi.getAll(),
                feedApi.getResupplyHistory(),
                import('@/api/groups').then(m => m.groupsApi.getAll()),
                import('@/api/cages').then(m => m.cagesApi.getAll()),
                import('@/api/caixas').then(m => m.caixasApi.getAll()),
                import('@/api/aviaries').then(m => m.aviariesApi.getAll())
            ]);

            setFeedTypes(types);
            setConfigurations(configs);
            setFeedHistory(history);
            setResupplyHistory(rHistory);
            setGroups(allGroups);
            setCages(allCages);
            setGrowthBoxes(boxes);
            setAviaries(allAviaries);
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- Feed Logic ---
    const handleSaveFeed = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingFeed && editingFeed.id) {
                await feedApi.updateFeedType(editingFeed.id, feedForm);
            } else {
                await feedApi.createFeedType(feedForm);
            }
            setIsFeedDialogOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar ração");
        }
    };

    const handleDeleteFeed = async (id: string) => {
        if (!confirm("Excluir esta ração?")) return;
        try {
            await feedApi.deleteFeedType(id);
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const openFeedDialog = (feed?: FeedType) => {
        if (feed) {
            setEditingFeed(feed);
            setFeedForm(feed);
        } else {
            setEditingFeed(null);
            setFeedForm({ name: '', phase: 'postura', price_per_kg: 0, supplier_default: '', active: true });
        }
        setIsFeedDialogOpen(true);
    };

    const handleResupply = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!user?.id) return alert("Usuário não autenticado");

            await feedApi.resupply(resupplyForm.feedId, resupplyForm.quantity, user.id);
            setIsResupplyDialogOpen(false);
            setResupplyForm({ quantity: 0, feedId: '', feedName: '' });
            fetchData();
            alert("Estoque atualizado com sucesso!");
        } catch (error) {
            console.error(error);
            alert("Erro ao abastecer ração");
        }
    };

    const openResupplyDialog = (feed: FeedType) => {
        setResupplyForm({
            feedId: feed.id,
            feedName: feed.name,
            quantity: 0
        });
        setIsResupplyDialogOpen(true);
    };

    // --- Configuration Logic ---
    const handleSaveConfig = async (groupType: string, configData: Partial<FeedConfiguration>) => {
        try {
            await feedApi.upsertConfiguration({
                group_type: groupType,
                ...configData
            });
            alert("Configuração salva com sucesso!");
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar configuração");
        }
    };

    const getGroupConfig = (type: string) => {
        return configurations.find(c => c.group_type === type) || {
            group_type: type,
            feed_type_id: '',
            quantity_per_cage: 0.240,
            schedule_times: ["07:00", "11:00", "15:00"],
            active: true
        };
    };

    const [selectedAviaryId, setSelectedAviaryId] = useState<string>('');

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={() => window.history.back()}>
                        ⬅️ Voltar
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Gestão de Alimentação</h1>
                        <p className="text-gray-500 mt-1">Configure rações, dietas e horários para cada fase.</p>
                    </div>
                </div>
                {/* AVIARY SELECTOR */}
                <div className="w-full md:w-80">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                        Filtrar por Aviário (Obrigatório)
                    </label>
                    <select
                        className="w-full h-11 border rounded-xl px-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all"
                        value={selectedAviaryId}
                        onChange={(e) => setSelectedAviaryId(e.target.value)}
                    >
                        <option value="">Selecione um aviário...</option>
                        {aviaries.map(av => (
                            <option key={av.id} value={av.id}>{av.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {!selectedAviaryId ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-gray-300">
                    <div className="p-4 bg-gray-50 rounded-full mb-4">
                        <ShoppingBag size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Selecione um Aviário</h3>
                    <p className="text-gray-500 text-center max-w-md mt-1">
                        Para gerenciar a alimentação, selecione o aviário desejado no filtro acima.
                    </p>
                </div>
            ) : (
                <Tabs defaultValue="config" className="w-full">

                    <TabsList className="bg-gray-100/50 p-1 rounded-xl">
                        <TabsTrigger value="config" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all">Catálogo de Rações</TabsTrigger>
                        <TabsTrigger value="schedule" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all">Configuração de Rotinas</TabsTrigger>
                        <TabsTrigger value="history" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all">Histórico & Logs</TabsTrigger>
                    </TabsList>

                    <TabsContent value="config" className="space-y-6 mt-6">
                        <Card className="border-none shadow-sm hover:shadow-lg transition-all duration-300">
                            <div className="h-1.5 bg-blue-500 w-full rounded-t-2xl"></div>
                            <CardHeader className="flex flex-row justify-between items-center px-6 pt-6">
                                <CardTitle className="flex items-center gap-3 text-xl">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                        <ShoppingBag size={20} />
                                    </div>
                                    Rações Cadastradas
                                </CardTitle>
                                <Button size="sm" onClick={() => openFeedDialog()} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all">
                                    <Plus size={16} className="mr-2" /> Nova Ração
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
                                            <tr>
                                                <th className="p-4 pl-6">Nome</th>
                                                <th className="p-4">Fase</th>
                                                <th className="p-4 font-bold text-blue-600">Estoque (Kg)</th>
                                                <th className="p-4">Preço (kg)</th>
                                                <th className="p-4">Fornecedor</th>
                                                <th className="p-4 pr-6 text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {feedTypes.map(feed => (
                                                <tr key={feed.id} className="hover:bg-blue-50/30 transition-colors group">
                                                    <td className="p-4 pl-6 font-medium text-gray-900">{feed.name}</td>
                                                    <td className="p-4">
                                                        <span className="capitalize px-2 py-1 rounded-md bg-gray-100 text-gray-600 font-medium text-xs">
                                                            {feed.phase}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 font-bold text-gray-900 flex items-center gap-3">
                                                        <div className="w-16 text-right">{feed.estoque_atual.toFixed(1)}</div>
                                                        <Button size="xs" variant="outline" className="h-7 px-2 text-[10px] border-blue-200 text-blue-600 hover:bg-blue-50" onClick={() => openResupplyDialog(feed)}>
                                                            Abastecer
                                                        </Button>
                                                    </td>
                                                    <td className="p-4 font-medium text-green-600">{formatCurrency(feed.price_per_kg)}</td>
                                                    <td className="p-4 text-gray-500">{feed.supplier_default || '-'}</td>
                                                    <td className="p-4 pr-6 text-right">
                                                        <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => openFeedDialog(feed)} className="p-1 hover:bg-blue-100 text-blue-600 rounded mb-0.5"><Edit size={16} /></button>
                                                            <button onClick={() => handleDeleteFeed(feed.id)} className="p-1 hover:bg-red-100 text-red-500 rounded mb-0.5"><Trash2 size={16} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {feedTypes.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <ShoppingBag size={32} className="text-gray-300" />
                                                            <p>Nenhuma ração cadastrada.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Feed Dialog */}
                        <Dialog open={isFeedDialogOpen} onOpenChange={setIsFeedDialogOpen}>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>{editingFeed ? 'Editar Ração' : 'Nova Ração'}</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleSaveFeed} className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-gray-700">Nome da Ração</Label>
                                        <Input
                                            value={feedForm.name}
                                            onChange={e => setFeedForm({ ...feedForm, name: e.target.value })}
                                            required
                                            placeholder="Ex: Ração Crescimento Premium"
                                            className="focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-gray-700">Fase</Label>
                                            <select
                                                className="w-full border rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={feedForm.phase}
                                                onChange={e => setFeedForm({ ...feedForm, phase: e.target.value })}
                                            >
                                                <option value="inicial">Inicial</option>
                                                <option value="crescimento">Crescimento</option>
                                                <option value="postura">Postura</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-gray-700">Preço por Kg</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={feedForm.price_per_kg}
                                                onChange={e => setFeedForm({ ...feedForm, price_per_kg: parseFloat(e.target.value) })}
                                                required
                                                className="focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-gray-700">Fornecedor Padrão</Label>
                                        <Input
                                            value={feedForm.supplier_default || ''}
                                            onChange={e => setFeedForm({ ...feedForm, supplier_default: e.target.value })}
                                            className="focus:ring-blue-500"
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">Salvar Ração</Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>

                        {/* Resupply Dialog */}
                        <Dialog open={isResupplyDialogOpen} onOpenChange={setIsResupplyDialogOpen}>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Abastecer Estoque</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleResupply} className="space-y-4 py-4">
                                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                        <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Ração selecionada</p>
                                        <p className="text-lg font-black text-blue-900">{resupplyForm.feedName}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-gray-700">Quantidade a Adicionar (Kg)</Label>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            value={resupplyForm.quantity}
                                            onChange={e => setResupplyForm({ ...resupplyForm, quantity: parseFloat(e.target.value) })}
                                            required
                                            autoFocus
                                            className="text-2xl h-14 font-black text-center focus:ring-blue-500"
                                        />
                                        <p className="text-xs text-gray-500 text-center font-medium">Insira o peso total recebido.</p>
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white w-full h-12 shadow-md hover:shadow-lg transition-all font-bold">Confirmar Abastecimento</Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </TabsContent>

                    <TabsContent value="history" className="space-y-6 mt-6">
                        <Card className="border-none shadow-sm hover:shadow-lg transition-all duration-300">
                            <div className="h-1.5 bg-purple-500 w-full rounded-t-2xl"></div>
                            <CardHeader className="flex flex-row justify-between items-center px-6 pt-6">
                                <CardTitle className="flex items-center gap-3 text-xl">
                                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                        <Settings size={20} />
                                    </div>
                                    Histórico de Alimentação & Performance
                                </CardTitle>
                                <Button size="sm" variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50" onClick={async () => {
                                    try {
                                        if (!confirm("Criar registro de teste agora?")) return;
                                        await feedApi.create({
                                            groupId: 'TEST-GROUP-ID',
                                            date: new Date().toISOString(),
                                            quantity: 1.5,
                                            feedTypeName: 'Ração Teste',
                                            feedTypeId: feedTypes[0]?.id,
                                            notes: 'Teste Manual Admin',
                                            executedAt: new Date().toISOString(),
                                            scheduledTime: '12:00'
                                        });
                                        alert("Teste criado! Atualizando...");
                                        fetchData();
                                    } catch (e) {
                                        console.error(e);
                                        alert("Erro ao criar teste: " + JSON.stringify(e));
                                    }
                                }}>
                                    + Simular Consumo (Teste)
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Tabs defaultValue="consumption">
                                    <TabsList className="bg-transparent px-6 border-b border-gray-100 w-full justify-start gap-4 rounded-none h-12">
                                        <TabsTrigger value="consumption" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent px-0 font-bold text-xs h-12 uppercase tracking-widest">Consumo Diário</TabsTrigger>
                                        <TabsTrigger value="stock" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent px-0 font-bold text-xs h-12 uppercase tracking-widest">Histórico de Abastecimento</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="consumption" className="m-0">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-gray-50/50 text-gray-700 font-semibold border-b border-gray-100">
                                                    <tr>
                                                        <th className="p-4 pl-6">Data</th>
                                                        <th className="p-4">Grupo / Gaiola</th>
                                                        <th className="p-4">Responsável</th>
                                                        <th className="p-4">Ração</th>
                                                        <th className="p-4">Programado</th>
                                                        <th className="p-4">Executado (Real)</th>
                                                        <th className="p-4 pr-6 text-right">Qtd (kg)</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {feedHistory
                                                        .filter(item => {
                                                            if (!selectedAviaryId) return false;
                                                            const group = groups.find(g => g.id === item.groupId);
                                                            const aviary = aviaries.find(a => a.id === item.groupId);
                                                            // Check if group belongs to aviary OR if item is directly linked to aviary
                                                            if (group && group.aviaryId === selectedAviaryId) return true;
                                                            if (aviary && aviary.id === selectedAviaryId) return true;
                                                            return false;
                                                        })
                                                        .map(item => {
                                                            const group = groups.find(g => g.id === item.groupId);
                                                            const cage = cages.find(c => c.id === item.cageId);
                                                            const box = growthBoxes.find(b => b.id === item.cageId);
                                                            const aviary = aviaries.find(a => a.id === item.groupId);

                                                            let executor = "-";
                                                            if (item.notes) {
                                                                const match = item.notes.match(/\(Registrado por (.*?)\)/);
                                                                if (match) executor = match[1];
                                                            }

                                                            return (
                                                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                                    <td className="p-4 pl-6 text-gray-600 font-medium">{new Date(item.date).toLocaleDateString()}</td>
                                                                    <td className="p-4">
                                                                        <div className="font-bold text-gray-900">
                                                                            {group ? group.name : (aviary ? aviary.name : (item.groupId ? `ID: ${item.groupId.substring(0, 5)}` : 'Sem Grupo'))}
                                                                        </div>
                                                                        {(cage || box) && (
                                                                            <div className="text-xs text-blue-600 mt-0.5 flex items-center gap-1 font-medium">
                                                                                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                                                                                {cage ? cage.name : `📦 ${box?.name}`}
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                    <td className="p-4">
                                                                        <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-semibold uppercase">
                                                                            {executor}
                                                                        </span>
                                                                    </td>
                                                                    <td className="p-4 text-gray-700">{item.feedTypeName || '-'}</td>
                                                                    <td className="p-4 font-mono text-blue-600 font-medium bg-blue-50/50 rounded px-2 w-fit">{item.scheduledTime || 'Manual'}</td>
                                                                    <td className="p-4 font-mono text-gray-600">
                                                                        {item.executedAt ? new Date(item.executedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                                    </td>
                                                                    <td className="p-4 pr-6 text-right font-bold text-gray-800">{item.quantity}</td>
                                                                </tr>
                                                            );
                                                        })}
                                                    {feedHistory.length === 0 && (
                                                        <tr><td colSpan={7} className="p-8 text-center text-gray-500">Nenhum histórico de consumo encontrado.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="stock" className="m-0">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-gray-50/50 text-gray-700 font-semibold border-b border-gray-100">
                                                    <tr>
                                                        <th className="p-4 pl-6">Data</th>
                                                        <th className="p-4">Ração</th>
                                                        <th className="p-4">Responsável</th>
                                                        <th className="p-4 pr-6 text-right">Qtd Adicionada (Kg)</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {resupplyHistory.map(item => {
                                                        const feed = feedTypes.find(f => f.id === item.racao_id);
                                                        return (
                                                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                                <td className="p-4 pl-6 text-gray-600 font-medium">{new Date(item.data_abastecimento).toLocaleString()}</td>
                                                                <td className="p-4 font-bold text-gray-900">{feed?.name || 'Ração Desconhecida'}</td>
                                                                <td className="p-4">
                                                                    <span className="px-2 py-1 rounded bg-orange-100 text-orange-700 text-xs font-semibold uppercase">
                                                                        {item.users?.name || 'Sistema'}
                                                                    </span>
                                                                </td>
                                                                <td className="p-4 pr-6 text-right font-black text-blue-600 text-lg">+{item.quantidade_adicionada.toFixed(1)}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                    {resupplyHistory.length === 0 && (
                                                        <tr><td colSpan={4} className="p-8 text-center text-gray-500">Nenhum histórico de abastecimento encontrado.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* --- CONFIGURATION TAB --- */}
                    <TabsContent value="schedule" className="space-y-6 mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {[
                                { type: 'production', name: 'Galinhas Poedeiras', description: 'Ciclo de Postura' },
                                { type: 'crescimento', name: 'Pintos (Crescimento)', description: 'Fase Inicial' },
                                { type: 'males', name: 'Machos', description: 'Reprodução' },
                                { type: 'breeders', name: 'Matrizes', description: 'Reprodução' }
                            ].map(group => {
                                const config = getGroupConfig(group.type);
                                return (
                                    <Card key={group.type} className="border-none shadow-sm hover:shadow-md transition-all duration-300">
                                        <div className={`h-1.5 w-full rounded-t-2xl ${group.type === 'crescimento' ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-lg flex justify-between items-center text-gray-800">
                                                {group.name}
                                                <div className="p-1.5 bg-gray-100 rounded-lg text-gray-500">
                                                    <Settings size={18} />
                                                </div>
                                            </CardTitle>
                                            <p className="text-sm text-gray-500 font-normal">{group.description}</p>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-5">
                                                {/* Ração */}
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Ração Padrão</Label>
                                                    <select
                                                        className="w-full border rounded-lg p-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                        value={config.feed_type_id || ''}
                                                        onChange={e => handleSaveConfig(group.type, { ...config, feed_type_id: e.target.value || null as any })}
                                                    >
                                                        <option value="">Selecione a ração...</option>
                                                        {feedTypes.filter(f => f.active).map(f => (
                                                            <option key={f.id} value={f.id}>{f.name} ({formatCurrency(f.price_per_kg)}/kg)</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Quantidade */}
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Quantidade por Gaiola (Kg)</Label>
                                                    <div className="flex gap-2 items-center">
                                                        <Input
                                                            type="number"
                                                            step="0.001"
                                                            value={config.quantity_per_cage}
                                                            onChange={e => {
                                                                const val = parseFloat(e.target.value);
                                                                handleSaveConfig(group.type, { ...config, quantity_per_cage: val });
                                                            }}
                                                            className="font-mono text-center font-medium focus:ring-blue-500 w-32"
                                                        />
                                                        <span className="text-sm text-gray-500 whitespace-nowrap bg-gray-100 px-3 py-2 rounded-lg border border-gray-200">Kg / horário</span>
                                                    </div>
                                                </div>

                                                {/* Horários */}
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Horários de Alimentação</Label>
                                                    <div className="flex gap-2">
                                                        {[0, 1, 2].map(index => (
                                                            <input
                                                                key={index}
                                                                type="time"
                                                                className="border rounded-lg p-2 text-sm w-full text-center bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
                                                                value={config.schedule_times[index] || ''}
                                                                onChange={e => {
                                                                    const newTimes = [...config.schedule_times];
                                                                    newTimes[index] = e.target.value;
                                                                    handleSaveConfig(group.type, { ...config, schedule_times: newTimes });
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
};
