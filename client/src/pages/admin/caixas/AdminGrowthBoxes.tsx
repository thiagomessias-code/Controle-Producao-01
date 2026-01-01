
import React, { useEffect, useState } from 'react';
import { caixasApi, GrowthBox } from '@/api/caixas'; // You'll need to create this hook/api wrapper
import { aviariesApi, Aviary } from '@/api/aviaries';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pencil, Trash2, Box } from 'lucide-react';

export const AdminGrowthBoxes: React.FC = () => {
    const [boxes, setBoxes] = useState<GrowthBox[]>([]);
    const [aviaries, setAviaries] = useState<Aviary[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState<{ id?: string; name?: string; aviaryId?: string; capacity?: number }>({});
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [boxesData, aviariesData] = await Promise.all([
                caixasApi.getAll(),
                aviariesApi.getAll()
            ]);
            setBoxes(boxesData || []);
            setAviaries(aviariesData || []);
        } catch (error) {
            console.error("Erro ao buscar dados:", error);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Map form data to API params
            const apiData = {
                nome: formData.name || '',
                aviario_id: formData.aviaryId || '',
                capacidade: formData.capacity || 100,
                status: 'active' as const
            };

            if (editingId) {
                await caixasApi.update(editingId, apiData);
            } else {
                await caixasApi.create(apiData);
            }

            fetchData();
            setIsDialogOpen(false);
            resetForm();
        } catch (err) {
            console.error(err);
            alert("Erro ao salvar caixa.");
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja excluir a caixa "${name}"?`)) return;

        try {
            await caixasApi.delete(id);
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Erro ao excluir caixa.");
        }
    };

    const handleEdit = (box: GrowthBox) => {
        setEditingId(box.id);
        setFormData({
            id: box.id,
            name: box.name,
            aviaryId: box.aviaryId,
            capacity: box.capacity
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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Gerenciar Caixas de Crescimento</h1>
                <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}>+ Nova Caixa</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingId ? 'Editar Caixa' : 'Nova Caixa'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <Label>Aviário</Label>
                                <select
                                    className="w-full border rounded p-2 bg-white"
                                    onChange={e => setFormData(prev => ({ ...prev, aviaryId: e.target.value }))}
                                    value={formData.aviaryId || ''}
                                    required
                                >
                                    <option value="">Selecione...</option>
                                    {aviaries.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
                            </div>
                            <Input
                                label="Nome da Caixa"
                                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                value={formData.name || ''}
                                required
                                placeholder="Ex: Caixa 01"
                            />
                            <Input
                                label="Capacidade"
                                type="number"
                                onChange={e => setFormData(prev => ({ ...prev, capacity: Number(e.target.value) }))}
                                value={formData.capacity?.toString() || ''}
                            />
                            <Button type="submit" className="w-full">
                                {editingId ? 'Salvar Alterações' : 'Criar Caixa'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {boxes.map((box) => (
                    <Card key={box.id}>
                        <CardHeader className="font-bold flex flex-row items-center justify-between pb-2">
                            <div className="flex items-center gap-2">
                                <Box className="text-blue-500" size={20} />
                                <span>{box.name}</span>
                            </div>
                            <div className="flex gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(box)}
                                    title="Editar"
                                    className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800"
                                >
                                    <Pencil size={18} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(box.id, box.name)}
                                    title="Excluir"
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                                >
                                    <Trash2 size={18} />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="text-sm text-gray-500 pt-0">
                            <p>Aviário: {aviaries.find(a => a.id === box.aviaryId)?.name || 'N/A'}</p>
                            <p>Capacidade: {box.capacity}</p>
                            <p className="mt-2">
                                <span className={`px-2 py-0.5 rounded text-xs ${box.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {box.status === 'active' ? 'Ativa' : 'Inativa'}
                                </span>
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};
