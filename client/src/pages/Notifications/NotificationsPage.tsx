import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useLocation } from "wouter";

export default function NotificationsPage() {
    const [, setLocation] = useLocation();

    // Mock Notifications
    const notifications = [
        { id: 1, title: "Estoque Baixo: Ovos", message: "O estoque de ovos está abaixo de 100 unidades.", type: "warning", date: "Hoje, 10:30" },
        { id: 2, title: "Lote Vencendo", message: "Lote BATCH-001 vence em 2 dias.", type: "critical", date: "Hoje, 08:15" },
        { id: 3, title: "Produção Registrada", message: "Produção do Galpão A registrada com sucesso.", type: "info", date: "Ontem, 16:45" },
        { id: 4, title: "Venda Realizada", message: "Venda #1234 confirmada.", type: "success", date: "Ontem, 14:20" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    ←
                </button>
                <h1 className="text-3xl font-bold text-foreground">Notificações</h1>
            </div>

            <div className="space-y-4">
                {notifications.map(notif => (
                    <Card key={notif.id} className={`border-l-4 ${notif.type === 'critical' ? 'border-l-red-500' :
                            notif.type === 'warning' ? 'border-l-yellow-500' :
                                notif.type === 'success' ? 'border-l-green-500' :
                                    'border-l-blue-500'
                        }`}>
                        <CardContent className="p-4 flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-foreground">{notif.title}</h3>
                                <p className="text-muted-foreground text-sm">{notif.message}</p>
                            </div>
                            <span className="text-xs text-muted-foreground">{notif.date}</span>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
