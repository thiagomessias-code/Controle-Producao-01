import React, { useEffect, useState } from 'react';
import { supabaseClient } from '@/api/supabaseClient';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import QRCodeModal from '@/components/ui/QRCodeModal';
import { QrCode, Trash2, Edit, User, Clock, Plus, MapPin, Layers, Box, Home } from 'lucide-react';
import { HistoryModal } from '@/components/ui/HistoryModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export const AviariosList: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [aviarios, setAviarios] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [cages, setCages] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);

    // Modals State
    const [aviaryModal, setAviaryModal] = useState({ open: false, editingId: null as string | null });
    const [groupModal, setGroupModal] = useState({ open: false, editingId: null as string | null, aviaryId: '' });
    const [cageModal, setCageModal] = useState({ open: false, editingId: null as string | null, groupId: '' });

    const [aviaryForm, setAviaryForm] = useState({ nome: '', cidade: '', responsaveis_ids: [] as string[] });
    const [groupForm, setGroupForm] = useState({ nome: '', tipo: 'postura' });
    const [cageForm, setCageForm] = useState({ nome: '', capacity: 6 });

    const [historyModal, setHistoryModal] = useState({ open: false });
    const [qrModal, setQrModal] = useState({ open: false, value: '', title: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [aviariosData, groupsData, cagesData, usersData] = await Promise.all([
                supabaseClient.get<any[]>('/aviarios'),
                supabaseClient.get<any[]>('/groups'),
                supabaseClient.get<any[]>('/cages'),
                supabaseClient.get<any[]>('/users')
            ]);
            setAviarios(aviariosData || []);
            setGroups(groupsData || []);
            setCages(cagesData || []);
            setUsers(usersData || []);
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
            toast.error('Erro ao carregar dados da fazenda.');
        } finally {
            setLoading(false);
        }
    };

    // --- Aviary Actions ---
    const handleOpenAviaryModal = (aviary?: any) => {
        if (aviary) {
            let ids: string[] = aviary.responsaveis_ids || (aviary.responsavel_id ? [aviary.responsavel_id] : []);
            setAviaryForm({ nome: aviary.nome, cidade: aviary.cidade, responsaveis_ids: ids });
            setAviaryModal({ open: true, editingId: aviary.id });
        } else {
            setAviaryForm({ nome: '', cidade: '', responsaveis_ids: [] });
            setAviaryModal({ open: true, editingId: null });
        }
    };

    const handleSaveAviary = async () => {
        try {
            const payload = { ...aviaryForm, responsavel_id: aviaryForm.responsaveis_ids[0] || null };
            if (aviaryModal.editingId) {
                await supabaseClient.put(`/aviarios/${aviaryModal.editingId}`, payload);
            } else {
                await supabaseClient.post('/aviarios', payload);
            }
            setAviaryModal({ open: false, editingId: null });
            fetchData();
            toast.success('Aviário salvo com sucesso!');
        } catch (e) { toast.error('Erro ao salvar aviário.'); }
    };

    const handleDeleteAviary = async (id: string) => {
        if (!confirm('Excluir este aviário apagará todos os dados vinculados?')) return;
        try {
            await supabaseClient.delete(`/aviarios/${id}`);
            fetchData();
        } catch (e) { toast.error('Erro ao deletar aviário.'); }
    };

    // --- Group Actions ---
    const handleOpenGroupModal = (aviaryId: string, group?: any) => {
        if (group) {
            setGroupForm({ nome: group.nome, tipo: group.tipo || 'postura' });
            setGroupModal({ open: true, editingId: group.id, aviaryId: group.aviario_id });
        } else {
            setGroupForm({ nome: '', tipo: 'postura' });
            setGroupModal({ open: true, editingId: null, aviaryId });
        }
    };

    const handleSaveGroup = async () => {
        try {
            const payload = { ...groupForm, aviario_id: groupModal.aviaryId };
            if (groupModal.editingId) {
                await supabaseClient.put(`/groups/${groupModal.editingId}`, payload);
            } else {
                await supabaseClient.post('/groups', payload);
            }
            setGroupModal({ open: false, editingId: null, aviaryId: '' });
            fetchData();
            toast.success('Grupo salvo com sucesso!');
        } catch (e) { toast.error('Erro ao salvar grupo.'); }
    };

    const handleDeleteGroup = async (id: string) => {
        if (!confirm('Excluir este grupo?')) return;
        try {
            await supabaseClient.delete(`/groups/${id}`);
            fetchData();
        } catch (e) { toast.error('Erro ao deletar grupo.'); }
    };

    // --- Cage Actions ---
    const handleOpenCageModal = (groupId: string, cage?: any) => {
        if (cage) {
            setCageForm({ nome: cage.name || cage.nome, capacity: cage.capacity });
            setCageModal({ open: true, editingId: cage.id, groupId: cage.groupId || cage.galpao_id });
        } else {
            setCageForm({ nome: '', capacity: 6 });
            setCageModal({ open: true, editingId: null, groupId });
        }
    };

    const handleSaveCage = async () => {
        try {
            const payload = {
                name: cageForm.nome,
                groupId: cageModal.groupId,
                capacity: cageForm.capacity,
                status: 'ativo'
            };
            if (cageModal.editingId) {
                await supabaseClient.put(`/cages/${cageModal.editingId}`, payload);
            } else {
                await supabaseClient.post('/cages', payload);
            }
            setCageModal({ open: false, editingId: null, groupId: '' });
            fetchData();
            toast.success('Gaiola salva com sucesso!');
        } catch (e) { toast.error('Erro ao salvar gaiola.'); }
    };

    const handleDeleteCage = async (id: string) => {
        if (!confirm('Excluir esta gaiola?')) return;
        try {
            await supabaseClient.delete(`/cages/${id}`);
            fetchData();
        } catch (e) { toast.error('Erro ao deletar gaiola.'); }
    };

    const handleShowQR = (value: string, title: string) => {
        setQrModal({ open: true, value, title: `QR Code - ${title}` });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Home className="text-blue-600" size={32} />
                        Gestão da Estrutura
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium">Controle aviários, grupos e gaiolas em um só lugar.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setHistoryModal({ open: true })} className="rounded-xl font-bold bg-white border-gray-200">
                        <Clock className="mr-2 h-4 w-4" /> Histórico
                    </Button>
                    <Button onClick={() => handleOpenAviaryModal()} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-lg shadow-blue-100">
                        <Plus className="mr-2 h-4 w-4" /> Novo Aviário
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest animate-pulse">
                    Carregando estrutura completa...
                </div>
            ) : aviarios.length === 0 ? (
                <Card className="p-20 text-center border-dashed border-2 bg-gray-50/50 rounded-3xl">
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-4">Nenhum aviário configurado ainda.</p>
                    <Button onClick={() => handleOpenAviaryModal()} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black px-8">Começar Agora</Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    <Accordion type="multiple" className="space-y-4">
                        {aviarios.map((aviary) => {
                            const aviaryGroups = groups.filter(g => g.aviario_id === aviary.id);
                            return (
                                <AccordionItem key={aviary.id} value={aviary.id} className="border border-gray-100 rounded-[2.5rem] bg-white shadow-sm overflow-hidden group/av">
                                    <AccordionTrigger className="px-8 py-8 hover:bg-gray-50/50 hover:no-underline transition-all [&[data-state=open]]:bg-blue-50/10">
                                        <div className="flex items-center gap-6 text-left w-full pr-4">
                                            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover/av:bg-blue-600 group-hover/av:text-white transition-all shadow-inner">
                                                <Home size={28} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <h3 className="font-black text-gray-900 text-2xl tracking-tight uppercase truncate">{aviary.nome}</h3>
                                                    <span className="text-[10px] bg-blue-100 text-blue-700 font-black px-2.5 py-1 rounded-full uppercase tracking-tighter border border-blue-200/50">
                                                        {aviaryGroups.length} GRUPOS
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className="text-xs text-gray-400 flex items-center gap-1.5 font-bold uppercase tracking-wide">
                                                        <MapPin size={14} className="text-gray-300" /> {aviary.cidade}
                                                    </span>
                                                    <div className="w-1 h-1 rounded-full bg-gray-200 mx-1"></div>
                                                    {(() => {
                                                        const ids = aviary.responsaveis_ids || (aviary.responsavel_id ? [aviary.responsavel_id] : []);
                                                        const names = ids.map((id: string) => users.find(u => u.id === id)?.name).filter(Boolean);
                                                        return (
                                                            <span className="text-[10px] text-gray-400 font-black uppercase flex items-center gap-1.5">
                                                                <User size={12} className="text-gray-300" /> {names.length > 0 ? names[0] : 'Sem Resp.'}
                                                                {names.length > 1 && <span className="text-blue-400">+{names.length - 1}</span>}
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                                <button onClick={() => handleOpenAviaryModal(aviary)} className="p-3 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all">
                                                    <Edit size={20} />
                                                </button>
                                                <button onClick={() => handleShowQR(aviary.qr_code || `AVIARIO:${aviary.id}`, aviary.nome)} className="p-3 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all">
                                                    <QrCode size={20} />
                                                </button>
                                                <button onClick={() => handleDeleteAviary(aviary.id)} className="p-3 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-8 pb-10 pt-4 bg-white/50">
                                        <div className="ml-5 pl-10 border-l-2 border-dashed border-gray-100 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2.5">
                                                    <Layers size={14} className="text-gray-300" /> Grupos de Produção
                                                </h4>
                                                <Button size="sm" onClick={() => handleOpenGroupModal(aviary.id)} className="bg-gray-900 hover:bg-blue-600 text-white font-black rounded-xl px-4 text-[10px] uppercase tracking-widest shadow-lg shadow-gray-200">
                                                    <Plus size={16} className="mr-2" /> Novo Grupo
                                                </Button>
                                            </div>

                                            {aviaryGroups.length === 0 ? (
                                                <div className="py-12 text-center bg-gray-50/50 border border-dashed border-gray-200 rounded-[2rem]">
                                                    <p className="text-[10px] text-gray-300 font-black uppercase tracking-widest italic">Nenhum grupo vinculado.</p>
                                                </div>
                                            ) : (
                                                <Accordion type="multiple" className="space-y-4">
                                                    {aviaryGroups.map((group) => {
                                                        const groupCages = cages.filter(c => (c.groupId || c.galpao_id) === group.id);
                                                        return (
                                                            <AccordionItem key={group.id} value={group.id} className="border border-gray-100 rounded-3xl bg-white shadow-sm overflow-hidden group/gr">
                                                                <AccordionTrigger className="px-6 py-5 hover:bg-blue-50/10 hover:no-underline transition-all">
                                                                    <div className="flex items-center justify-between w-full pr-4">
                                                                        <div className="flex items-center gap-5">
                                                                            <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl group-hover/gr:bg-blue-500 group-hover/gr:text-white transition-all">
                                                                                <Layers size={20} />
                                                                            </div>
                                                                            <div className="text-left">
                                                                                <p className="font-extrabold text-gray-900 text-lg leading-tight uppercase tracking-tight">{group.nome}</p>
                                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                                    <span className="text-[9px] bg-white text-gray-400 px-2 py-0.5 rounded-full font-black border border-gray-100 uppercase">
                                                                                        {groupCages.length} GAIOLAS
                                                                                    </span>
                                                                                    <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wider">{group.type || 'Padrão'}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                                                            <button onClick={() => handleOpenGroupModal(aviary.id, group)} className="p-2.5 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                                                                                <Edit size={18} />
                                                                            </button>
                                                                            <button onClick={() => handleShowQR(group.qr_code || `GRUPO:${group.id}`, group.nome)} className="p-2.5 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                                                                                <QrCode size={18} />
                                                                            </button>
                                                                            <button onClick={() => handleDeleteGroup(group.id)} className="p-2.5 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                                                                <Trash2 size={18} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </AccordionTrigger>
                                                                <AccordionContent className="px-6 pb-6 pt-4 bg-gray-50/20">
                                                                    <div className="flex items-center justify-between mb-5 mt-2">
                                                                        <h5 className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2.5">
                                                                            <Box size={14} className="text-blue-300" /> Gaiolas Individuais
                                                                        </h5>
                                                                        <Button size="sm" variant="outline" onClick={() => handleOpenCageModal(group.id)} className="h-8 text-[10px] font-black border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl px-4 shadow-sm shadow-blue-50">
                                                                            <Plus size={14} className="mr-1.5" /> Adicionar Gaiola
                                                                        </Button>
                                                                    </div>

                                                                    {groupCages.length === 0 ? (
                                                                        <p className="text-center py-10 text-[10px] text-gray-300 font-black uppercase tracking-widest italic border border-dashed border-gray-100 rounded-2xl bg-white/50">Nenhuma gaiola</p>
                                                                    ) : (
                                                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                                                            {groupCages.map((cage) => (
                                                                                <div key={cage.id} className="relative group/cage p-4 bg-white rounded-3xl border border-gray-100 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-100/30 transition-all duration-300">
                                                                                    <div className="flex flex-col gap-2">
                                                                                        <p className="text-[11px] font-black text-gray-900 uppercase truncate leading-tight pr-4" title={cage.name || cage.nome}>
                                                                                            {cage.name || cage.nome}
                                                                                        </p>
                                                                                        <div className="flex items-center justify-between mt-auto">
                                                                                            <span className="text-[9px] font-black bg-blue-50 text-blue-500 px-2 py-0.5 rounded-lg border border-blue-100/50 uppercase">
                                                                                                CAP: {cage.capacity}
                                                                                            </span>
                                                                                            <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                                                                                <button onClick={() => handleOpenCageModal(group.id, cage)} className="p-1.5 text-gray-200 hover:text-blue-600 transition-colors">
                                                                                                    <Edit size={14} />
                                                                                                </button>
                                                                                                <button onClick={() => handleShowQR(cage.qr_code || `GAIOLA:${cage.id}`, cage.name || cage.nome)} className="p-1.5 text-gray-200 hover:text-indigo-600 transition-colors">
                                                                                                    <QrCode size={14} />
                                                                                                </button>
                                                                                                <button onClick={() => handleDeleteCage(cage.id)} className="p-1.5 text-gray-200 hover:text-red-500 transition-colors">
                                                                                                    <Trash2 size={14} />
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </AccordionContent>
                                                            </AccordionItem>
                                                        );
                                                    })}
                                                </Accordion>
                                            )}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                </div>
            )}

            {/* --- Unified Modals --- */}

            <Dialog open={aviaryModal.open} onOpenChange={(o) => setAviaryModal(prev => ({ ...prev, open: o }))}>
                <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8 max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight uppercase border-b pb-4 mb-2">
                            {aviaryModal.editingId ? 'Editar Aviário' : 'Novo Aviário'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label className="uppercase text-[10px] font-black text-gray-400 tracking-widest ml-1">Nome do Aviário</Label>
                            <Input value={aviaryForm.nome} onChange={e => setAviaryForm({ ...aviaryForm, nome: e.target.value })} placeholder="Ex: Aviário A" className="rounded-2xl h-12 focus:ring-blue-500 font-bold" />
                        </div>
                        <div className="space-y-2">
                            <Label className="uppercase text-[10px] font-black text-gray-400 tracking-widest ml-1">Cidade / Setor</Label>
                            <Input value={aviaryForm.cidade} onChange={e => setAviaryForm({ ...aviaryForm, cidade: e.target.value })} placeholder="Ex: Galpão Sul" className="rounded-2xl h-12 focus:ring-blue-500 font-bold" />
                        </div>
                        <div className="space-y-2">
                            <Label className="uppercase text-[10px] font-black text-gray-400 tracking-widest ml-1">Equipe Responsável</Label>
                            <div className="border border-gray-100 rounded-[2rem] p-4 max-h-48 overflow-y-auto bg-gray-50/50 space-y-1">
                                {users.map(u => (
                                    <label key={u.id} className="flex items-center gap-3 p-3 hover:bg-white rounded-2xl cursor-pointer transition-all border border-transparent hover:border-blue-100 hover:shadow-sm">
                                        <input
                                            type="checkbox"
                                            checked={aviaryForm.responsaveis_ids.includes(u.id)}
                                            onChange={(e) => {
                                                const ids = e.target.checked ? [...aviaryForm.responsaveis_ids, u.id] : aviaryForm.responsaveis_ids.filter(id => id !== u.id);
                                                setAviaryForm({ ...aviaryForm, responsaveis_ids: ids });
                                            }}
                                            className="rounded-lg h-5 w-5 text-blue-600 border-gray-200 focus:ring-blue-500"
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-black text-gray-900 leading-tight">{u.name}</p>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">{u.role}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-3 sm:justify-start">
                        <Button onClick={handleSaveAviary} className="bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl px-8 h-12 shadow-lg shadow-blue-100">Salvar Aviário</Button>
                        <Button variant="ghost" onClick={() => setAviaryModal({ open: false, editingId: null })} className="font-bold text-gray-400 hover:text-gray-600 px-6 h-12 rounded-2xl">Cancelar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={groupModal.open} onOpenChange={(o) => setGroupModal(prev => ({ ...prev, open: o }))}>
                <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight uppercase border-b pb-4 mb-2">
                            {groupModal.editingId ? 'Editar Grupo' : 'Novo Grupo'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label className="uppercase text-[10px] font-black text-gray-400 tracking-widest ml-1">Identificação do Grupo</Label>
                            <Input value={groupForm.nome} onChange={e => setGroupForm({ ...groupForm, nome: e.target.value })} placeholder="Ex: Lote A-1" className="rounded-2xl h-12 focus:ring-blue-500 font-bold" />
                        </div>
                        <div className="space-y-2">
                            <Label className="uppercase text-[10px] font-black text-gray-400 tracking-widest ml-1">Tipo de Produção</Label>
                            <select className="w-full h-12 px-4 border border-gray-200 rounded-2xl bg-white font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" value={groupForm.tipo} onChange={e => setGroupForm({ ...groupForm, tipo: e.target.value })}>
                                <option value="postura">Produtoras (Postura)</option>
                                <option value="machos">Machos</option>
                                <option value="reprodutoras">Reprodutoras</option>
                                <option value="crescimento">Crescimento</option>
                                <option value="matriz">Matriz</option>
                            </select>
                        </div>
                    </div>
                    <DialogFooter className="gap-3 sm:justify-start">
                        <Button onClick={handleSaveGroup} className="bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl px-8 h-12 shadow-lg shadow-blue-100">Salvar Grupo</Button>
                        <Button variant="ghost" onClick={() => setGroupModal({ open: false, editingId: null, aviaryId: '' })} className="font-bold text-gray-400 hover:text-gray-600 px-6 h-12 rounded-2xl">Cancelar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={cageModal.open} onOpenChange={(o) => setCageModal(prev => ({ ...prev, open: o }))}>
                <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8 max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-gray-900 tracking-tight uppercase border-b pb-4 mb-2">
                            {cageModal.editingId ? 'Editar Gaiola' : 'Nova Gaiola'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label className="uppercase text-[10px] font-black text-gray-400 tracking-widest ml-1">Nome/ID da Gaiola</Label>
                            <Input value={cageForm.nome} onChange={e => setCageForm({ ...cageForm, nome: e.target.value })} placeholder="Ex: G-01" className="rounded-2xl h-12 focus:ring-blue-500 font-bold" />
                        </div>
                        <div className="space-y-2">
                            <Label className="uppercase text-[10px] font-black text-gray-400 tracking-widest ml-1">Capacidade (Aves)</Label>
                            <Input type="number" value={cageForm.capacity} onChange={e => setCageForm({ ...cageForm, capacity: Number(e.target.value) })} className="rounded-2xl h-12 focus:ring-blue-500 font-bold" />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:justify-start flex-col">
                        <Button onClick={handleSaveCage} className="bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl px-8 h-12 shadow-lg shadow-blue-100 w-full">Salvar Gaiola</Button>
                        <Button variant="ghost" onClick={() => setCageModal({ open: false, editingId: null, groupId: '' })} className="font-bold text-gray-400 hover:text-gray-600 px-6 h-10 rounded-2xl w-full">Cancelar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <QRCodeModal
                isOpen={qrModal.open}
                onClose={() => setQrModal({ ...qrModal, open: false, value: '', title: '' })}
                value={qrModal.value}
                title={qrModal.title}
            />

            <HistoryModal
                isOpen={historyModal.open}
                onClose={() => setHistoryModal({ ...historyModal, open: false })}
                entityType="aviary"
                entityId=""
                entityName="Geral"
            />
        </div>
    );
};
