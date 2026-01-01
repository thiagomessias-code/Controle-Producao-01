import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Bell, Calendar, Send } from 'lucide-react';
import Input from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/api/supabaseClient';
import Loading from '@/components/ui/Loading';

export const AdminNotifications: React.FC = () => {
    const [templates, setTemplates] = React.useState<any[]>([]);
    const [users, setUsers] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [sending, setSending] = React.useState(false);

    // Form state
    const [destId, setDestId] = React.useState('all');
    const [message, setMessage] = React.useState('');

    // New Task State
    const [showNewTaskModal, setShowNewTaskModal] = React.useState(false);
    const [newTaskData, setNewTaskData] = React.useState({
        title: '',
        default_time: '08:00',
        recurrence: 'daily'
    });

    React.useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [{ data: tmpls }, { data: usrs }] = await Promise.all([
                supabase.from('tasks_templates').select('*').eq('active', true).order('default_time'),
                supabase.from('users').select('id, name, role')
            ]);
            setTemplates(tmpls || []);
            setUsers(usrs || []);
        } catch (error) {
            console.error("Erro ao buscar dados:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!message) return alert('Digite uma mensagem.');
        setSending(true);
        try {
            if (destId === 'all') {
                const notifications = users.map(u => ({
                    usuario_id: u.id,
                    mensagem: message,
                    nivel: 'info',
                    lida: false
                }));
                const { error } = await supabase.from('notificacoes').insert(notifications);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('notificacoes').insert({
                    usuario_id: destId,
                    mensagem: message,
                    nivel: 'info',
                    lida: false
                });
                if (error) throw error;
            }
            alert('Notificação enviada com sucesso!');
            setMessage('');
        } catch (error: any) {
            console.error('Erro detalhado ao enviar notificação:', error);
            const errorMsg = error?.message || error?.details || 'Erro desconhecido ao enviar.';
            alert(`Erro ao enviar: ${errorMsg}`);
        } finally {
            setSending(false);
        }
    };

    const handleCreateTask = async () => {
        if (!newTaskData.title) return alert('Digite um título.');

        try {
            const { error } = await supabase.from('tasks_templates').insert({
                title: newTaskData.title,
                key: newTaskData.title.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4),
                default_time: newTaskData.default_time,
                recurrence: newTaskData.recurrence,
                category_id: null, // Global or select category if needed
                active: true
            });

            if (error) throw error;

            alert('Tarefa recorrente criada!');
            setShowNewTaskModal(false);
            setNewTaskData({ title: '', default_time: '08:00', recurrence: 'daily' });
            fetchData(); // Refresh list
        } catch (err: any) {
            console.error(err);
            alert('Erro ao criar tarefa: ' + err.message);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Notificações & Tarefas</h1>
                    <p className="text-gray-500 mt-1">Gerencie comunicados e rotinas da equipe.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-none shadow-sm hover:shadow-lg transition-all duration-300">
                    <div className="h-1.5 bg-blue-500 w-full rounded-t-2xl"></div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-xl">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                <Send size={20} />
                            </div>
                            Enviar Notificação
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-700">Destinatário</Label>
                            <select
                                className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                value={destId}
                                onChange={(e) => setDestId(e.target.value)}
                            >
                                <option value="all">Todos os Funcionários</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-700">Mensagem</Label>
                            <textarea
                                className="flex min-h-[120px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                                placeholder="Digite sua mensagem aqui..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                        </div>
                        <Button
                            onClick={handleSend}
                            disabled={sending}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all h-10"
                        >
                            {sending ? 'Enviando...' : 'Enviar Agora'}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm hover:shadow-lg transition-all duration-300">
                    <div className="h-1.5 bg-green-500 w-full rounded-t-2xl"></div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-xl">
                            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                <Calendar size={20} />
                            </div>
                            Tarefas Agendadas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {loading ? (
                                <Loading message="Carregando rotinas..." />
                            ) : templates.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">Nenhuma rotina agendada.</p>
                            ) : (
                                templates.map((tmpl) => (
                                    <div key={tmpl.id} className="flex items-center p-4 bg-gray-50/50 rounded-xl border border-gray-100 hover:border-green-200 transition-colors group">
                                        <div className="p-2 bg-white rounded-full shadow-sm mr-4 text-yellow-500">
                                            <Bell size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-800">{tmpl.title}</p>
                                            <p className="text-xs text-gray-500 font-medium bg-gray-200/50 px-2 py-0.5 rounded-full w-fit mt-1">
                                                {tmpl.recurrence === 'daily' ? 'Diário' : tmpl.recurrence} • {tmpl.default_time.substring(0, 5)}
                                            </p>
                                        </div>
                                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">Editar</Button>
                                    </div>
                                ))
                            )}

                            <Button
                                variant="outline"
                                className="w-full mt-2 border-dashed border-gray-300 hover:border-gray-400 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                onClick={() => setShowNewTaskModal(true)}
                            >
                                + Nova Tarefa Recorrente
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Modal de Nova Tarefa */}
            {showNewTaskModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <Card className="w-full max-w-md bg-white shadow-2xl relative">
                        <CardHeader>
                            <CardTitle>Nova Tarefa Recorrente</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Título</Label>
                                <Input
                                    value={newTaskData.title}
                                    onChange={e => setNewTaskData({ ...newTaskData, title: e.target.value })}
                                    placeholder="Ex: Coleta de Ovos"
                                />
                            </div>
                            <div>
                                <Label>Horário Padrão</Label>
                                <Input
                                    type="time"
                                    value={newTaskData.default_time}
                                    onChange={e => setNewTaskData({ ...newTaskData, default_time: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Recorrência</Label>
                                <select
                                    className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                    value={newTaskData.recurrence}
                                    onChange={e => setNewTaskData({ ...newTaskData, recurrence: e.target.value })}
                                >
                                    <option value="daily">Diária</option>
                                    <option value="weekly">Semanal</option>
                                </select>
                            </div>
                            <div className="flex gap-2 justify-end pt-4">
                                <Button variant="ghost" onClick={() => setShowNewTaskModal(false)}>Cancelar</Button>
                                <Button onClick={handleCreateTask}>Salvar Tarefa</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};
