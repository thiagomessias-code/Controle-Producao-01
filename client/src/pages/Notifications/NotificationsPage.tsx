import React from 'react';
import { Card, CardContent } from "@/components/ui/Card";
import { useLocation } from "wouter";
import { useAppStore } from "@/hooks/useAppStore";
import { Bell, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/hooks/useAuth";

export default function NotificationsPage() {
    const { pendingTasks, todos } = useAppStore();
    const { user } = useAuth();
    const [, setLocation] = useLocation();
    const [dbNotifications, setDbNotifications] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (!user?.id) return;
        fetchNotifications();
    }, [user?.id]);

    const fetchNotifications = async () => {
        try {
            const { data } = await supabase
                .from('notificacoes')
                .select('*')
                .eq('usuario_id', user?.id)
                .order('created_at', { ascending: false });
            setDbNotifications(data || []);
        } catch (error) {
            console.error("Erro ao buscar notificações:", error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await supabase.from('notificacoes').update({ lida: true }).eq('id', id);
            setDbNotifications(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
        } catch (error) {
            console.error("Erro ao marcar como lida:", error);
        }
    };

    // Map Pending Tasks and Recent Todos to a common notification format
    const localNotifications = [
        ...pendingTasks.map(task => ({
            id: task.id,
            title: task.title,
            message: "Tarefa agendada aguardando execução.",
            type: "warning",
            date: new Date(task.timestamp).toLocaleString(),
            action: () => setLocation(task.actionUrl),
            lida: false
        })),
        ...todos.slice(0, 5).map(todo => ({
            id: todo.id,
            title: todo.task,
            message: todo.isCompleted ? "Tarefa concluída." : "Tarefa pendente na lista.",
            type: todo.isCompleted ? "success" : "info",
            date: "Hoje",
            action: () => setLocation("/"),
            lida: todo.isCompleted
        }))
    ];

    const allNotifications = [
        ...dbNotifications.map(n => ({
            id: n.id,
            title: n.nivel === 'critical' ? 'ALERTA CRÍTICO' : 'Comunicado',
            message: n.mensagem,
            type: n.nivel,
            date: new Date(n.created_at).toLocaleString(),
            action: () => {
                markAsRead(n.id);
                // No specific action URL in the table yet, maybe just home
                setLocation("/");
            },
            lida: n.lida,
            isDb: true
        })),
        ...localNotifications
    ].sort((a, b) => {
        // Simple sort by date string (not ideal but works for now as fallback)
        return (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0);
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    ←
                </button>
                <h1 className="text-3xl font-bold text-foreground">Notificações</h1>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-10 text-muted-foreground">Carregando mensagens...</div>
                ) : allNotifications.length === 0 ? (
                    <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
                        <Bell className="mx-auto h-12 w-12 text-muted-foreground/30" />
                        <p className="mt-4 text-muted-foreground">Você não tem novas notificações.</p>
                    </div>
                ) : (
                    allNotifications.map(notif => (
                        <Card
                            key={notif.id}
                            className={`group hover:shadow-md transition-all cursor-pointer border-l-4 ${notif.lida ? 'opacity-60 bg-gray-50/50' : 'bg-white'
                                } ${notif.type === 'critical' ? 'border-l-red-500' :
                                    notif.type === 'warning' ? 'border-l-yellow-500' :
                                        notif.type === 'success' ? 'border-l-green-500' :
                                            'border-l-blue-500'
                                }`}
                            onClick={notif.action}
                        >
                            <CardContent className="p-4 flex justify-between items-start">
                                <div className="flex gap-4">
                                    <div className={`mt-1 p-2 rounded-full ${notif.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                                        notif.type === 'success' ? 'bg-green-100 text-green-600' :
                                            notif.type === 'critical' ? 'bg-red-100 text-red-600' :
                                                'bg-blue-100 text-blue-600'
                                        }`}>
                                        {notif.type === 'warning' ? <AlertTriangle size={18} /> :
                                            notif.type === 'success' ? <CheckCircle size={18} /> :
                                                notif.type === 'critical' ? <AlertTriangle size={18} /> :
                                                    <Info size={18} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-foreground group-hover:text-blue-600 transition-colors">{notif.title}</h3>
                                            {!notif.lida && <span className="w-2 h-2 bg-blue-600 rounded-full"></span>}
                                        </div>
                                        <p className="text-muted-foreground text-sm">{notif.message}</p>
                                    </div>
                                </div>
                                <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">{notif.date}</span>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
