import { useState } from "react";
import { useLocation } from "wouter";
import Button from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useAppStore } from "@/hooks/useAppStore";

export default function Header() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { sidebarOpen, setSidebarOpen, pendingTasks, removePendingTask } = useAppStore();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const handleNotificationClick = (task: any) => {
    setLocation(task.actionUrl);
    setShowNotifications(false);
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-40">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <svg
              className="w-6 h-6 text-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐔</span>
            <h1 className="text-xl font-bold text-foreground">Codornas do Sertão</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-muted rounded-full transition-colors"
            >
              {pendingTasks.length > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                  {pendingTasks.length}
                </span>
              )}
              <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                <div className="p-3 border-b border-border">
                  <h3 className="font-semibold text-foreground">Tarefas Pendentes</h3>
                </div>
                {pendingTasks.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    Nenhuma tarefa pendente
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {pendingTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleNotificationClick(task)}
                        className="p-3 hover:bg-muted cursor-pointer transition-colors"
                      >
                        <p className="text-sm font-medium text-foreground">{task.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(task.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {user && (
            <>
              <span className="text-sm text-muted-foreground hidden md:block">
                Olá, {user.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
              >
                Sair
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
