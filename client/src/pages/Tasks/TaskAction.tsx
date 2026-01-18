import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useAppStore } from "@/hooks/useAppStore";
import { useBatchById } from "@/hooks/useBatches";

export default function TaskAction() {
    const [location, setLocation] = useLocation();
    const searchParams = new URLSearchParams(window.location.search);
    const batchId = searchParams.get("batchId") || searchParams.get("groupId");
    const taskType = searchParams.get("lockTask") || searchParams.get("task");
    const time = searchParams.get("time");

    const { batch, isLoading } = useBatchById(batchId || "");
    const { todos, toggleTodo, pendingTasks, removePendingTask } = useAppStore();
    const [isConfirming, setIsConfirming] = useState(false);

    // Map taskType to generic Todo task name
    const getGenericTaskName = (type: string | null) => {
        switch (type) {
            case "feed": return "Alimentação";
            case "water": return "Água";
            case "egg": return "Coleta de ovos";
            default: return "Cuidado diário";
        }
    };

    const taskTitle = getGenericTaskName(taskType);

    const handleConfirm = () => {
        setIsConfirming(true);

        // 1. Mark as completed in Todos (Checklist)
        // Find by title being contained in the todo task (since titles are dynamic e.g. "Alimentar Lote...")
        const todo = todos.find(t => t.task.includes(batch?.name || '') && t.task.includes(taskTitle));
        if (todo && !todo.isCompleted) {
            toggleTodo(todo.id);
        }

        // 2. Remove from Pending Tasks if it was there
        const pending = pendingTasks.find(p => p.title.includes(batch?.name || '') && p.title.includes(taskTitle));
        if (pending) {
            removePendingTask(pending.id);
        }

        // Simulate API call or delay
        setTimeout(() => {
            setIsConfirming(false);
            // If it's feeding, go to feed page, otherwise home
            if (taskType === 'feed') setLocation("/feed");
            else if (taskType === 'egg') setLocation("/production/register");
            else setLocation("/");
        }, 800);
    };

    if (!batchId || !taskType) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold text-destructive">Parâmetros inválidos</h2>
                <Button variant="outline" onClick={() => setLocation("/")} className="mt-4">
                    Voltar para Início
                </Button>
            </div>
        );
    }

    if (isLoading) {
        return <div className="p-8 text-center">Carregando informações do lote...</div>;
    }

    return (
        <div className="max-w-md mx-auto mt-8 px-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl text-primary">Executar Tarefa</CardTitle>
                    <CardDescription>
                        Confirme a execução da tarefa agendada
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Tarefa:</span>
                            <span className="font-bold text-lg">{taskTitle}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Lote:</span>
                            <span className="font-medium">{batch?.name || "Lote não encontrado"}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Horário Agendado:</span>
                            <span className="font-medium">{time}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={handleConfirm}
                            isLoading={isConfirming}
                            className="w-full"
                        >
                            ✅ Confirmar Execução
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setLocation("/")}
                            disabled={isConfirming}
                            className="w-full"
                        >
                            Cancelar
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
