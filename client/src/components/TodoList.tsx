import { useAppStore } from "@/hooks/useAppStore";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Checkbox } from "./ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "./ui/badge";

export default function TodoList() {
  const { todos, toggleTodo, removeTodo } = useAppStore();

  const pendingTodos = todos.filter((todo) => !todo.isCompleted);
  const completedTodos = todos.filter((todo) => todo.isCompleted);

  const renderTodoItem = (todo: any) => (
    <div key={todo.id} className="flex items-start space-x-3 py-2 hover:bg-muted/50 rounded-md px-2 transition-colors">
      <Checkbox
        id={`todo-${todo.id}`}
        checked={todo.isCompleted}
        onCheckedChange={() => toggleTodo(todo.id)}
        className="mt-1"
      />
      <div className="flex-1 space-y-1">
        <label
          htmlFor={`todo-${todo.id}`}
          className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
            todo.isCompleted ? "line-through text-muted-foreground" : ""
          }`}
        >
          {todo.task}
        </label>
        <div className="flex items-center space-x-2">
          {todo.isAutomatic && (
            <Badge variant="secondary" className="text-xs">
              Automático
            </Badge>
          )}
          {todo.dueDate && (
            <span className="text-xs text-muted-foreground">
              Vencimento: {format(new Date(todo.dueDate), "dd MMM", { locale: ptBR })}
            </span>
          )}
        </div>
      </div>
      {/* Botão de remover (opcional, apenas para tarefas não automáticas) */}
      {!todo.isAutomatic && (
        <button
          onClick={() => removeTodo(todo.id)}
          className="text-muted-foreground hover:text-destructive transition-colors"
          title="Remover tarefa"
        >
          {/* Ícone de lixeira ou X */}
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        </button>
      )}
    </div>
  );

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl">Lista de Tarefas ({pendingTodos.length})</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full max-h-[400px] px-6 pb-6">
          {pendingTodos.length > 0 ? (
            <div className="space-y-2">
              {pendingTodos.map(renderTodoItem)}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Parabéns! Nenhuma tarefa pendente.
            </p>
          )}

          {completedTodos.length > 0 && (
            <>
              <Separator className="my-4" />
              <h3 className="text-lg font-semibold mb-2 text-muted-foreground">Concluídas</h3>
              <div className="space-y-2 opacity-70">
                {completedTodos.map(renderTodoItem)}
              </div>
            </>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
