import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useAppStore } from "@/hooks/useAppStore";
import { useBatchById } from "@/hooks/useBatches";

export default function TaskAction() {
    const [location, setLocation] = useLocation();
    const searchParams = new URLSearchParams(window.location.search);
    const batchId = searchParams.get("groupId"); // URL param still named groupId for now
    const taskType = searchParams.get("task"); // 'feed', 'water', 'egg'
    const time = searchParams.get("time");

    const { batch, isLoading } = useBatchById(batchId || "");
    const { todos, toggleTodo } = useAppStore();
    const [isConfirming, setIsConfirming] = useState(false);

    // Map taskType to generic Todo task name
    const getGenericTaskName = (type: string | null) => {
        switch (type) {
            case "feed": return "Alimentação";
            case "water": return "Água";
            case "egg": return "Coleta de ovos";
            default: return "Outros cuidados diários";
        }
    };

    const handleConfirm = () => {
        setIsConfirming(true);

        // Find the generic todo item and mark it as completed if not already
        const genericTaskName = getGenericTaskName(taskType);
        const todo = todos.find(t => t.task === genericTaskName && t.isAutomatic);

        if (todo && !todo.isCompleted) {
            toggleTodo(todo.id);
        }

        // Simulate API call or delay
        setTimeout(() => {
            setIsConfirming(false);
            setLocation("/");
        }, 1000);
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

    const taskTitle = getGenericTaskName(taskType);

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
