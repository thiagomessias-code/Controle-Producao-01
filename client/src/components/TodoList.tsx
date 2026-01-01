import { useAppStore } from "@/hooks/useAppStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/Card";
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
          className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${todo.isCompleted ? "line-through text-muted-foreground" : ""
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
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
        </button>
      )}
    </div>
  );

  return (
    <Card className="h-full flex flex-col border-none shadow-xl shadow-orange-100/30 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-full -mr-12 -mt-12 opacity-50 z-0"></div>
      <CardHeader className="pb-4 relative z-10 border-none">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <CardTitle className="text-lg font-black text-gray-900 leading-tight">
              Lista de Tarefas
              {pendingTodos.length > 0 && (
                <span className="ml-2 text-xs bg-orange-600 text-white px-2 py-0.5 rounded-full font-black">
                  {pendingTodos.length}
                </span>
              )}
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Organização Diária</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 relative z-10">
        <ScrollArea className="h-full max-h-[400px] px-6 pb-6">
          {pendingTodos.length > 0 ? (
            <div className="space-y-3">
              {pendingTodos.map((todo) => (
                <div key={todo.id} className="flex items-start space-x-4 py-3 hover:bg-orange-50/50 rounded-xl px-2 transition-all group border border-transparent hover:border-orange-100/50">
                  <Checkbox
                    id={`todo-${todo.id}`}
                    checked={todo.isCompleted}
                    onCheckedChange={() => toggleTodo(todo.id)}
                    className="mt-1 border-orange-200 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                  />
                  <div className="flex-1 space-y-1.5">
                    <label
                      htmlFor={`todo-${todo.id}`}
                      className={`text-sm font-bold leading-tight cursor-pointer ${todo.isCompleted ? "line-through text-gray-300" : "text-gray-700 hover:text-orange-600 transition-colors"
                        }`}
                    >
                      {todo.task}
                    </label>
                    <div className="flex items-center space-x-3">
                      {todo.isAutomatic && (
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                          <span className="text-[10px] font-bold text-orange-500 uppercase tracking-tight">Automático</span>
                        </div>
                      )}
                      {todo.dueDate && (
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-200"></span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                            {format(new Date(todo.dueDate), "dd MMM", { locale: ptBR })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {!todo.isAutomatic && (
                    <button
                      onClick={() => removeTodo(todo.id)}
                      className="text-gray-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                      title="Remover tarefa"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="text-4xl mb-4 grayscale opacity-20">🚀</div>
              <p className="text-sm font-bold text-gray-400">
                Tudo concluído! <br /> Você está em dia.
              </p>
            </div>
          )}

          {completedTodos.length > 0 && (
            <div className="mt-8 pt-4 border-t border-orange-50">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 px-2">Concluídas</h3>
              <div className="space-y-2 opacity-50 grayscale">
                {completedTodos.map((todo) => (
                  <div key={todo.id} className="flex items-start space-x-4 py-2 px-2">
                    <div className="w-4 h-4 rounded border border-gray-200 flex items-center justify-center text-[10px] text-gray-400 mt-1">✓</div>
                    <label className="text-sm font-medium line-through text-gray-400 leading-tight">{todo.task}</label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
