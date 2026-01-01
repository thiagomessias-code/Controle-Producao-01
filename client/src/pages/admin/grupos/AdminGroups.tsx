import React, { useEffect, useState } from 'react';
import { supabaseClient } from '@/api/supabaseClient';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import QRCodeModal from '@/components/ui/QRCodeModal';
import { QrCode, Plus, Home, Trash2 } from 'lucide-react';

// Interface for Group (Galpão)
interface Group {
    id: string;
    nome: string;
    aviario_id?: string;
    type?: string;
    qr_code?: string;
}

export const AdminGroups: React.FC = () => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [aviarios, setAviarios] = useState<any[]>([]); // List of Aviarios for selection
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // QR Modal State
    const [qrModal, setQrModal] = useState<{ open: boolean; value: string; title: string }>({
        open: false,
        value: '',
        title: ''
    });

    // Form State
    const [formData, setFormData] = useState<Partial<Group>>({});
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const [groupsData, aviariosData] = await Promise.all([
                supabaseClient.get<Group[]>('/groups'),
                supabaseClient.get<any[]>('/aviarios')
            ]);
            setGroups(groupsData || []);
            setAviarios(aviariosData || []);
        } catch (error) {
            console.error('Erro ao buscar galpões:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await supabaseClient.put(`/groups/${editingId}`, formData);
            } else {
                await supabaseClient.post('/groups', formData);
            }
            fetchGroups();
            setIsDialogOpen(false);
            resetForm();
        } catch (error) {
            console.error('Erro ao salvar galpão:', error);
            alert('Erro ao salvar. Verifique o console.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este galpão?')) return;
        try {
            await supabaseClient.delete(`/groups/${id}`);
            fetchGroups();
        } catch (error) {
            console.error('Erro ao deletar:', error);
        }
    };

    const startEdit = (group: Group) => {
        setFormData(group);
        setEditingId(group.id);
        setIsDialogOpen(true);
    };

    const handleShowQR = (group: Group) => {
        setQrModal({
            open: true,
            value: group.qr_code || `GRUPO:${group.id}`,
            title: `QR Code - ${group.nome}`
        });
    };

    const resetForm = () => {
        setFormData({});
        setEditingId(null);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Gerenciar Grupos</h1>
                    <p className="text-gray-500 mt-1">Organize seus lotes em grupos dentro dos aviários.</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all">
                            <Plus size={18} className="mr-2" />
                            Novo Grupo
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{editingId ? 'Editar Grupo' : 'Novo Grupo'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-5 py-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-700">Nome do Grupo</Label>
                                <Input
                                    className="focus:ring-blue-500"
                                    value={formData.nome || ''}
                                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                    placeholder="Ex: Grupo A"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-700">Aviário (Vinculado)</Label>
                                <select
                                    className="w-full border rounded-lg p-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={formData.aviario_id || ''}
                                    onChange={e => setFormData({ ...formData, aviario_id: e.target.value })}
                                    required
                                >
                                    <option value="">Selecione um Aviário...</option>
                                    {aviarios.map(av => (
                                        <option key={av.id} value={av.id}>{av.nome}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-2">
                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">Salvar</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-12 text-center text-gray-500">Carregando grupos...</div>
                ) : groups.length === 0 ? (
                    <div className="col-span-full text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <p className="text-lg font-medium text-gray-600">Nenhum grupo cadastrado</p>
                        <p className="text-sm text-gray-400 mt-1">Crie um grupo para começar a organizar sua produção.</p>
                    </div>
                ) : (
                    groups.map((group) => (
                        <Card key={group.id} className="group border-none shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                            <div className="h-1.5 bg-indigo-500 w-full"></div>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">{group.nome || 'Sem Nome'}</h3>
                                        {group.aviario_id ? (
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                                                <Home size={12} />
                                                {aviarios.find(a => a.id === group.aviario_id)?.nome || 'Aviário Desconhecido'}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">Sem aviário vinculado</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleShowQR(group)}
                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        title="Ver QR Code"
                                    >
                                        <QrCode size={20} />
                                    </button>
                                </div>

                                <div className="flex gap-2 mt-6 pt-4 border-t border-gray-100">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => startEdit(group)}
                                        className="flex-1 border-gray-200 hover:bg-gray-50 text-gray-700"
                                    >
                                        Editar
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(group.id)}
                                        className="text-red-400 hover:text-red-600 hover:bg-red-50 px-3"
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
        </div>
    );
};
