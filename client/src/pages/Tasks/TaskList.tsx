import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useAppStore } from "@/hooks/useAppStore";

export default function TaskList() {
    const [, setLocation] = useLocation();
    const { pendingTasks, removePendingTask } = useAppStore();

    const handleExecute = (task: typeof pendingTasks[0]) => {
        // Remove from pending list as we are about to execute it
        removePendingTask(task.id);
        setLocation(task.actionUrl);
    };

    return (
        <div className="max-w-2xl mx-auto mt-8 px-4">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-foreground">Tarefas Pendentes</h1>
                <Button variant="outline" onClick={() => setLocation("/")}>
                    Voltar
                </Button>
            </div>

            {pendingTasks.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-xl text-muted-foreground">Nenhuma tarefa pendente! 🎉</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Você está em dia com suas obrigações.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {pendingTasks.map((task) => (
                        <Card key={task.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground">{task.title}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Recebido em: {new Date(task.timestamp).toLocaleTimeString()}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => handleExecute(task)}
                                    >
                                        Executar
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => removePendingTask(task.id)}
                                    >
                                        Dispensar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
