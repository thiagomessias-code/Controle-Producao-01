import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { warehouseApi, InventoryItem } from '@/api/warehouse';
import { aviariesApi } from '@/api/aviaries';
import { groupsApi } from '@/api/groups';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/ui/Loading';
import { Package, MapPin, Filter, Plus, Edit2, Trash2, Calendar, ShoppingCart, Crosshair } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Button from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import Input from '@/components/ui/Input';
import { Label } from '@/components/ui/label';

export const AdminStock: React.FC = () => {
    const { user } = useAuth();
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [aviaries, setAviaries] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAviaryId, setSelectedAviaryId] = useState<string | null>(null);

    // Dialog state
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [form, setForm] = useState<any>({
        subtype: '',
        type: 'egg',
        quantity: 0,
        expirationDate: '',
        origin: { groupId: '', date: new Date().toISOString() }
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [inv, avs, grps] = await Promise.all([
                warehouseApi.getInventory(),
                aviariesApi.getAll(),
                groupsApi.getAll()
            ]);
            setInventory(inv);
            setAviaries(avs);
            setGroups(grps);
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await warehouseApi.addInventory({
                ...form,
                quantity: Number(form.quantity)
            });
            setIsCreateDialogOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Erro ao criar item");
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;
        try {
            await warehouseApi.updateInventoryItem(editingItem.id, {
                nome: form.subtype,
                categoria: form.type === 'egg' ? 'ovo' : (form.type === 'meat' ? 'carne' : 'insumo'),
                quantidade_atual: Number(form.quantity),
                data_validade: form.expirationDate
            });
            setIsEditDialogOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Erro ao atualizar item");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este registro de estoque? Isso removerá o item permanentemente.")) return;
        try {
            await warehouseApi.deleteInventoryItem(id);
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Erro ao excluir item");
        }
    };

    const openEdit = (item: InventoryItem) => {
        setEditingItem(item);
        setForm({
            subtype: item.subtype,
            type: item.type,
            quantity: item.quantity,
            expirationDate: item.expirationDate || '',
            origin: item.origin
        });
        setIsEditDialogOpen(true);
    };

    const openCreate = () => {
        setForm({
            subtype: '',
            type: 'egg',
            quantity: 0,
            expirationDate: '',
            origin: { groupId: groups[0]?.id || '', date: new Date().toISOString() }
        });
        setIsCreateDialogOpen(true);
    };

    // Derived stats
    const stats = {
        crus: inventory.filter(i => i.type === 'egg' && i.subtype.toLowerCase().includes('cru')).reduce((acc, i) => acc + i.quantity, 0),
        ferteis: inventory.filter(i => i.type === 'egg' && i.subtype.toLowerCase().includes('fértil')).reduce((acc, i) => acc + i.quantity, 0),
        carne: inventory.filter(i => i.type === 'meat').reduce((acc, i) => acc + i.quantity, 0),
        totais: inventory.reduce((acc, i) => acc + i.quantity, 0)
    };

    // Filter Logic
    const filteredInventory = inventory.filter(item => {
        if (!selectedAviaryId) return true; // Mostra tudo se admin não filtrar? Ou exige? 
        // Pra manter consistência, vamos permitir ver tudo ou filtrar.
        const group = groups.find(g => g.id === item.origin.groupId);
        if (!group) return selectedAviaryId === 'WAREHOUSE'; // Itens sem grupo são "Warehouse"
        return String(group.aviaryId) === String(selectedAviaryId);
    });

    if (loading) return <Loading message="Carregando estoque..." />;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-orange-50">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100">
                        <Package size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Gestão de Armazém</h1>
                        <p className="text-gray-500 text-sm font-medium">Controle total de produtos, lotes e validade.</p>
                    </div>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <Select value={selectedAviaryId || 'ALL'} onValueChange={(val) => setSelectedAviaryId(val === 'ALL' ? null : val)}>
                        <SelectTrigger className="w-full md:w-60 h-11 bg-gray-50 border-gray-100 rounded-xl font-bold">
                            <MapPin size={16} className="mr-2 text-blue-600" />
                            <SelectValue placeholder="Todos Aviários" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todos Aviários</SelectItem>
                            <SelectItem value="WAREHOUSE">Estoque Geral (Sem Origem)</SelectItem>
                            {aviaries.map(av => (
                                <SelectItem key={av.id} value={av.id}>{av.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg shadow-blue-100 rounded-xl h-11">
                        <Plus size={20} className="mr-2" /> Nova Entrada
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <Card className="border-none shadow-sm bg-white group hover:shadow-md transition-all">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <ShoppingCart size={12} /> Ovos Crus
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-gray-900">{stats.crus.toLocaleString()}</div>
                        <div className="text-[10px] font-bold text-gray-400 mt-1">Unidades em estoque</div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white group hover:shadow-md transition-all">
                    <CardHeader className="pb-2 text-blue-600">
                        <CardTitle className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={12} /> Ovos Férteis
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-blue-600">{stats.ferteis.toLocaleString()}</div>
                        <div className="text-[10px] font-bold text-gray-400 mt-1">Para incubação</div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white group hover:shadow-md transition-all">
                    <CardHeader className="pb-2 text-red-600">
                        <CardTitle className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                            <Crosshair size={12} /> Abatimentos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-red-600">{stats.carne.toLocaleString()}</div>
                        <div className="text-[10px] font-bold text-gray-400 mt-1">Kg de carne em estoque</div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-blue-600 text-white group hover:shadow-md transition-all">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Estoque Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{stats.totais.toLocaleString()}</div>
                        <div className="text-[10px] font-bold text-blue-200 mt-1">Itens monitorados</div>
                    </CardContent>
                </Card>
            </div>

            {/* Inventory Table */}
            <Card className="border-none shadow-sm overflow-hidden rounded-2xl">
                <CardHeader className="bg-white border-b border-gray-50">
                    <CardTitle className="text-lg font-black text-gray-800 flex items-center gap-2">
                        <Package size={18} className="text-blue-600" />
                        Inventário Detalhado
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50/50 text-gray-500 font-black text-[10px] uppercase tracking-widest border-b border-gray-100">
                                <tr>
                                    <th className="p-4 pl-6">Produto / Subtipo</th>
                                    <th className="p-4">Categoria</th>
                                    <th className="p-4">Origem (Lote/Local)</th>
                                    <th className="p-4">Validade / Entrada</th>
                                    <th className="p-4 text-center">Quantidade</th>
                                    <th className="p-4 pr-6 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredInventory.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="p-4 pl-6">
                                            <div className="font-black text-gray-900">{item.subtype}</div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">REF: {item.id.substring(0, 8)}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${item.type === 'egg' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                item.type === 'meat' ? 'bg-red-50 text-red-600 border-red-100' :
                                                    'bg-blue-50 text-blue-600 border-blue-100'
                                                }`}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-xs font-bold text-gray-700">
                                                {item.origin.batchId ? `Lote: ${item.origin.batchId.substring(0, 8)}` : 'Estoque Central'}
                                            </div>
                                            <div className="text-[10px] text-gray-400 font-medium">Aviário: {aviaries.find(a => a.id === groups.find(g => g.id === item.origin.groupId)?.aviaryId)?.name || 'Geral'}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-xs font-bold text-gray-900">
                                                {item.expirationDate ? new Date(item.expirationDate).toLocaleDateString() : '-'}
                                            </div>
                                            <div className="text-[10px] text-gray-400">Entrada: {new Date(item.createdAt).toLocaleDateString()}</div>
                                        </td>
                                        <td className="p-4 text-center font-black text-gray-900 text-lg">
                                            {item.quantity}
                                            <span className="text-[10px] text-gray-400 ml-1 font-bold">{item.type === 'meat' ? 'kg' : 'un'}</span>
                                        </td>
                                        <td className="p-4 pr-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openEdit(item)} className="p-0 bg-blue-50 text-blue-600 rounded-lg h-9 w-9 flex items-center justify-center hover:bg-blue-100 transition-all shadow-sm border border-blue-100" title="Editar Registro">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="p-0 bg-red-50 text-red-600 rounded-lg h-9 w-9 flex items-center justify-center hover:bg-red-100 transition-all shadow-sm border border-red-100" title="Excluir Registro">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredInventory.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-gray-400">
                                            <Package size={48} className="mx-auto opacity-20 mb-2" />
                                            <p className="font-black uppercase tracking-widest text-xs">Sem itens no inventário</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(val) => val === false && (setIsCreateDialogOpen(false), setIsEditDialogOpen(false))}>
                <DialogContent className="sm:max-w-[425px] rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-gray-900">{isEditDialogOpen ? 'Editar Item no Armazém' : 'Nova Entrada no Armazém'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={isEditDialogOpen ? handleUpdate : handleCreate} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-gray-500">Nome do Produto</Label>
                            <Input value={form.subtype} onChange={e => setForm({ ...form, subtype: e.target.value })} required placeholder="Ex: Ovos Crus Grandes" className="rounded-xl h-11 font-bold" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase text-gray-500">Categoria</Label>
                                <select className="w-full h-11 border rounded-xl px-3 bg-gray-50 text-sm font-bold outline-none" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                    <option value="egg">Ovos</option>
                                    <option value="meat">Carne / Abates</option>
                                    <option value="chick">Pintinhos / Insumo</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase text-gray-500">Quantidade</Label>
                                <Input type="number" step="0.1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required className="rounded-xl h-11 font-black text-lg text-blue-600" />
                            </div>
                        </div>
                        {!isEditDialogOpen && (
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase text-gray-500">Origem (Galpão)</Label>
                                <select className="w-full h-11 border rounded-xl px-3 bg-gray-50 text-sm font-bold outline-none" value={form.origin.groupId} onChange={e => setForm({ ...form, origin: { ...form.origin, groupId: e.target.value } })}>
                                    <option value="">Nenhum (Estoque Central)</option>
                                    {groups.map(g => (
                                        <option key={g.id} value={g.id}>{g.name} ({g.aviaries?.name})</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-gray-500">Data de Validade</Label>
                            <Input type="date" value={form.expirationDate} onChange={e => setForm({ ...form, expirationDate: e.target.value })} className="rounded-xl h-11 font-bold" />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black h-12 shadow-lg shadow-blue-100 rounded-xl">
                                {isEditDialogOpen ? 'Salvar Alterações' : 'Confirmar Entrada'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};
