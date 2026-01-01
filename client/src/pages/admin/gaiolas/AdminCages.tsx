import React, { useEffect, useState } from 'react';
import { supabaseClient } from '@/api/supabaseClient';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import QRCodeModal from '@/components/ui/QRCodeModal';
import { HistoryModal } from '@/components/ui/HistoryModal';
import { QrCode, Pencil, Trash2, Clock, Plus, Box, Home } from 'lucide-react';
import { toast } from "sonner";
import { useCages } from "@/hooks/useCages";
import { groupsApi } from "@/api/groups";

export const AdminCages: React.FC = () => {
    const { cages, create, update, delete: remove, isLoading } = useCages();
    const [groups, setGroups] = useState<any[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState<{ id?: string; nome?: string; galpao_id?: string; capacity?: number }>({});
    const [editingId, setEditingId] = useState<string | null>(null);

    // History Modal
    const [historyModal, setHistoryModal] = useState({ open: false, id: '', name: '' });

    // QR Modal State
    const [qrModal, setQrModal] = useState<{ open: boolean; value: string; title: string }>({
        open: false,
        value: '',
        title: ''
    });

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const data = await groupsApi.getAll();
            setGroups(data || []);
        } catch (error) {
            console.error("Erro ao buscar grupos:", error);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.nome || "Nova Gaiola",
                groupId: formData.galpao_id || "",
                capacity: formData.capacity || 6,
                status: "active" as const
            };

            if (editingId) {
                await update({ id: editingId, data: payload });
            } else {
                await create(payload);
            }

            setIsDialogOpen(false);
            resetForm();
            toast.success(editingId ? "Gaiola atualizada com sucesso!" : "Gaiola criada com sucesso!");
        } catch (err) {
            console.error(err);
            toast.error("Erro ao salvar gaiola.");
        }
    };

    const handleDelete = async (id: string, nome: string) => {
        if (!confirm(`Tem certeza que deseja excluir a gaiola "${nome}"?`)) return;

        try {
            await remove(id);
            toast.success("Gaiola excluída com sucesso.");
        } catch (err) {
            console.error(err);
            toast.error("Erro ao excluir gaiola.");
        }
    };

    const handleEdit = (cage: any) => {
        setEditingId(cage.id);
        setFormData({
            id: cage.id,
            nome: cage.name, // Hook returns 'name'
            galpao_id: cage.groupId, // Hook returns 'groupId'
            capacity: cage.capacity
        });
        setIsDialogOpen(true);
    };

    const resetForm = () => {
        setFormData({});
        setEditingId(null);
    };

    const handleOpenChange = (open: boolean) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
    };

    const handleShowQR = (cage: any) => {
        setQrModal({
            open: true,
            value: `GAIOLA:${cage.id}`,
            title: `QR Code - ${cage.name}`
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Gerenciar Gaiolas</h1>
                    <p className="text-gray-500 mt-1">Configure suas gaiolas e capacidade produtiva.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setHistoryModal({ open: true, id: '', name: 'Geral' })}
                        title="Ver Histórico Geral"
                        className="bg-white hover:bg-gray-50 text-gray-700 border-gray-200 shadow-sm"
                    >
                        <Clock className="mr-2 h-4 w-4" /> Histórico
                    </Button>
                    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
                        <DialogTrigger asChild>
                            <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all">
                                <Plus size={18} className="mr-2" />
                                Nova Gaiola
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>{editingId ? 'Editar Gaiola' : 'Nova Gaiola'}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSave} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">Galpão (Grupo)</Label>
                                    <select
                                        className="w-full border rounded-lg p-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        onChange={e => setFormData({ ...formData, galpao_id: e.target.value })}
                                        value={formData.galpao_id || ''}
                                        required
                                    >
                                        <option value="">Selecione...</option>
                                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">Nome da Gaiola</Label>
                                    <Input
                                        className="focus:ring-blue-500"
                                        onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                        value={formData.nome || ''}
                                        required
                                        placeholder="Ex: Gaiola A1"
                                        autoFocus
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">Capacidade *</Label>
                                    <Input
                                        type="number"
                                        className="focus:ring-blue-500"
                                        onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })}
                                        value={formData.capacity || ''}
                                        placeholder="Padrão: 6"
                                        min="1"
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                    {editingId ? 'Salvar Alterações' : 'Criar Gaiola'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {isLoading ? (
                    <div className="col-span-full text-center py-10">Carregando gaiolas...</div>
                ) : cages.length === 0 ? (
                    <div className="col-span-full py-16 text-center text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex flex-col items-center gap-2">
                            <Box size={40} className="text-gray-300" />
                            <p>Nenhuma gaiola cadastrada.</p>
                        </div>
                    </div>
                ) : (
                    cages.map((cage) => (
                        <Card key={cage.id} className="group border-none shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                            <div className="h-1 bg-gradient-to-r from-blue-400 to-indigo-500 w-full"></div>
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1" title={cage.name}>{cage.name || 'Sem Nome'}</h3>
                                    <button
                                        onClick={() => handleShowQR(cage)}
                                        className="text-gray-400 hover:text-indigo-600 p-1 rounded-md hover:bg-indigo-50 transition-colors"
                                        title="QR Code"
                                    >
                                        <QrCode size={18} />
                                    </button>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                                        <Home size={14} className="mr-2 text-gray-400" />
                                        <span className="truncate">
                                            {groups.find(g => g.id === cage.groupId)?.name || '...'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-600 px-1">
                                        <span>Capacidade:</span>
                                        <span className="font-semibold">{cage.capacity} aves</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit(cage)}
                                        className="flex-1 h-8 text-xs border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                                    >
                                        <Pencil size={14} className="mr-1.5" /> Editar
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(cage.id, cage.name)}
                                        className="h-8 px-2 text-red-400 hover:text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <QRCodeModal
                isOpen={qrModal.open}
                onClose={() => setQrModal({ ...qrModal, open: false })}
                value={qrModal.value}
                title={qrModal.title}
            />

            <HistoryModal
                isOpen={historyModal.open}
                onClose={() => setHistoryModal({ ...historyModal, open: false })}
                entityType="cage"
                entityId={historyModal.id}
                entityName={historyModal.name}
            />
        </div>
    );
};
