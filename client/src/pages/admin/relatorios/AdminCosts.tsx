import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { operationalApi, type OperationalCost } from '@/api/operational';
import { aviariesApi } from '@/api/aviaries';
import { Wallet, Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export const AdminCosts: React.FC = () => {
    const [costs, setCosts] = useState<OperationalCost[]>([]);
    const [loading, setLoading] = useState(true);
    const [aviaries, setAviaries] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        categoria: 'energia' as any,
        descricao: '',
        valor: '',
        data_referencia: new Date().toISOString().split('T')[0],
        aviario_id: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [costsData, aviariesData] = await Promise.all([
                operationalApi.costs.getAll(),
                aviariesApi.getAll()
            ]);
            setCosts(costsData);
            setAviaries(aviariesData);
        } catch (error) {
            console.error('Failed to fetch data', error);
            toast.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.valor || parseFloat(formData.valor) <= 0) {
            return toast.error('Informe um valor válido');
        }

        try {
            await operationalApi.costs.create({
                categoria: formData.categoria,
                descricao: formData.descricao,
                valor: parseFloat(formData.valor),
                data_referencia: formData.data_referencia,
                aviario_id: formData.aviario_id || undefined
            });
            toast.success('Custo registrado com sucesso');
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Failed to create cost', error);
            toast.error('Erro ao registrar custo');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja excluir este registro?')) return;
        try {
            await operationalApi.costs.delete(id);
            toast.success('Registro excluído');
            fetchData();
        } catch (error) {
            toast.error('Erro ao excluir');
        }
    };

    return (
        <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Custos Operacionais</h2>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1 italic">
                        Gestão de despesas fixas e variáveis
                    </p>
                </div>
                <Button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-6 py-6 shadow-xl shadow-blue-100 flex items-center gap-2 font-black uppercase tracking-widest text-xs"
                >
                    <Plus className="w-5 h-5" />
                    Registrar Custo
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white border-none shadow-xl shadow-blue-50 rounded-[32px] overflow-hidden">
                    <CardHeader className="pb-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total do Mês (Geral)</span>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <p className="text-3xl font-black text-gray-900">
                                R$ {costs.reduce((acc, c) => acc + Number(c.valor), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <div className="bg-blue-50 p-3 rounded-2xl">
                                <Wallet className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-[10px] font-bold text-blue-600 uppercase mt-4 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Impacta ROI nos Relatórios IA
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-white border-none shadow-2xl shadow-gray-100 rounded-[32px] overflow-hidden">
                <CardContent className="p-0">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-50">
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Categoria</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Aviário</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Valor</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {costs.map((cost) => (
                                <tr key={cost.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <span className="text-xs font-bold text-gray-600">
                                                {format(new Date(cost.data_referencia + 'T12:00:00'), 'dd/MM/yyyy')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                                            {cost.categoria}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-medium text-gray-600">{cost.descricao || '-'}</td>
                                    <td className="px-8 py-5 text-xs font-bold text-gray-400">
                                        {aviaries.find(a => a.id === cost.aviario_id)?.name || 'Geral'}
                                    </td>
                                    <td className="px-8 py-5 text-right font-black text-gray-900">
                                        R$ {Number(cost.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-8 py-5">
                                        <button
                                            onClick={() => handleDelete(cost.id)}
                                            className="p-2 text-gray-300 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {costs.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-8 py-10 text-center text-gray-400 font-bold text-xs uppercase tracking-widest italic">
                                        Nenhum custo registrado
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Novo Custo Operacional"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Categoria</label>
                            <select
                                className="w-full h-12 border-2 border-gray-100 rounded-xl px-4 bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all text-sm font-bold text-gray-700"
                                value={formData.categoria}
                                onChange={e => setFormData({ ...formData, categoria: e.target.value as any })}
                            >
                                <option value="energia">Energia Elétrica</option>
                                <option value="agua">Água / Saneamento</option>
                                <option value="mao_de_obra">Mão de Obra</option>
                                <option value="manutencao">Manutenção</option>
                                <option value="investimento">Investimento / Equipamentos</option>
                                <option value="outros">Outros</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Valor (R$)</label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.valor}
                                onChange={e => setFormData({ ...formData, valor: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data de Referência</label>
                        <Input
                            type="date"
                            value={formData.data_referencia}
                            onChange={e => setFormData({ ...formData, data_referencia: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Aviário Responsável (Opcional)</label>
                        <select
                            className="w-full h-12 border-2 border-gray-100 rounded-xl px-4 bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all text-sm font-bold text-gray-700"
                            value={formData.aviario_id}
                            onChange={e => setFormData({ ...formData, aviario_id: e.target.value })}
                        >
                            <option value="">Geral / Administrativo</option>
                            {aviaries.map(av => (
                                <option key={av.id} value={av.id}>{av.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descrição</label>
                        <Input
                            placeholder="Ex: Conta de luz referente a Dezembro"
                            value={formData.descricao}
                            onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                        />
                    </div>

                    <div className="pt-4">
                        <Button type="submit" className="w-full py-6 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-100">
                            Salvar Registro
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
