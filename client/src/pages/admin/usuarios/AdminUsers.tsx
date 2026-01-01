import React, { useEffect, useState } from 'react';
import { supabaseClient } from '@/api/supabaseClient';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Trash2, Edit, UserPlus } from 'lucide-react';

export const AdminUsers: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'funcionario',
        status: 'ativo',
        password: ''
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await supabaseClient.get<any[]>('/users');
            setUsers(data || []);
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (user?: any) => {
        if (user) {
            setEditingId(user.id);
            setFormData({
                name: user.name,
                email: user.email,
                role: user.role || 'funcionario',
                status: user.status || 'ativo',
                password: '' // Reset password field
            });
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                email: '',
                role: 'funcionario',
                status: 'ativo',
                password: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            if (editingId) {
                await supabaseClient.put(`/users/${editingId}`, formData);
            } else {
                await supabaseClient.post('/users', formData);
            }
            setIsModalOpen(false);
            fetchUsers();
            alert(editingId ? 'Usuário atualizado!' : 'Usuário criado com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar usuário:', error);
            alert('Erro ao salvar usuário.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
        try {
            await supabaseClient.delete(`/users/${id}`);
            fetchUsers();
        } catch (error) {
            console.error('Erro ao deletar:', error);
            alert('Erro ao deletar usuário.');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Gerenciar Usuários</h1>
                    <p className="text-gray-500 mt-1">Administre o acesso e permissões da equipe.</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all">
                    <UserPlus size={18} className="mr-2" />
                    Novo Usuário
                </Button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow>
                            <TableHead className="w-[30%]">Nome</TableHead>
                            <TableHead className="w-[30%]">Email</TableHead>
                            <TableHead className="w-[15%]">Função</TableHead>
                            <TableHead className="w-[15%]">Status</TableHead>
                            <TableHead className="text-right w-[10%]">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                                    <div className="flex justify-center items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        Carregando...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                                    Nenhum usuário encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id} className="hover:bg-gray-50/80 transition-colors cursor-default group">
                                    <TableCell className="font-medium text-gray-900">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs uppercase">
                                                {user.name.charAt(0)}
                                            </div>
                                            {user.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-gray-600">{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className={user.role === 'admin' ? "bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200" : "bg-gray-100 text-gray-700 border-gray-200"}>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.status === 'ativo' ? 'default' : 'destructive'}
                                            className={`border ${user.status === 'ativo' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 shadow-none' : 'bg-red-50 text-red-700 border-red-200 shadow-none'}`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${user.status === 'ativo' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                            {user.status || 'Ativo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleOpenModal(user)}>
                                                <Edit size={16} className="text-gray-500 hover:text-blue-600" />
                                            </Button>
                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(user.id)}>
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Create/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Nome Completo</label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ex: João Silva"
                                className="focus:ring-blue-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Email</label>
                            <Input
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="Ex: joao@exemplo.com"
                                type="email"
                                className="focus:ring-blue-500"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Função (Role)</label>
                                <select
                                    className="w-full border rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="funcionario">Funcionário</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Status</label>
                                <select
                                    className="w-full border rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.status || 'ativo'}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="ativo">Ativo</option>
                                    <option value="inativo">Inativo</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">
                                {editingId ? 'Nova Senha (opcional)' : 'Senha'}
                            </label>
                            <Input
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder={editingId ? "Deixe em branco para não alterar" : "******"}
                                type="password"
                                className="focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
