import { useState } from "react";
import { useLocation } from "wouter";
import Button from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useAppStore } from "@/hooks/useAppStore";
import { useDbNotifications } from "@/hooks/useDbNotifications";

export default function Header() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { sidebarOpen, setSidebarOpen, pendingTasks, removePendingTask } = useAppStore();
  const { notifications: dbNotifs, markAsRead } = useDbNotifications();
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
    <header className="bg-white/80 backdrop-blur-md border-b border-orange-100/50 sticky top-0 z-40 shadow-sm shadow-orange-50/50">
      <div className="flex items-center justify-between h-16 px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-orange-50 text-orange-600 rounded-xl transition-all active:scale-95"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="p-0.5 bg-orange-100 rounded-full shadow-inner">
              <img
                src="/logo.jpg"
                alt="Logo"
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm transition-transform hover:rotate-3"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none">
                Codornas do Sertão
              </h1>
              <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest leading-none mt-1">
                Excelência na Gestão
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 hover:bg-orange-50 text-gray-600 hover:text-orange-600 rounded-xl transition-all active:scale-95"
            >
              {(pendingTasks.length + dbNotifs.length) > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-orange-600 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                  {pendingTasks.length + dbNotifs.length}
                </span>
              )}
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white border border-orange-100 rounded-2xl shadow-xl shadow-orange-100/50 max-h-96 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="p-4 border-b border-orange-50 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">Notificações</h3>
                  <span className="bg-orange-100 text-orange-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    {pendingTasks.length + dbNotifs.length} Novas
                  </span>
                </div>
                {(pendingTasks.length === 0 && dbNotifs.length === 0) ? (
                  <div className="p-8 text-center">
                    <div className="text-3xl mb-2 opacity-20">✅</div>
                    <p className="text-sm text-gray-400 font-medium whitespace-nowrap">Tudo em dia por aqui!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-orange-50">
                    {/* Database Notifications */}
                    {dbNotifs.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          markAsRead(notif.id);
                          setLocation('/notifications');
                          setShowNotifications(false);
                        }}
                        className="p-4 hover:bg-red-50/50 cursor-pointer transition-colors border-l-4 border-l-red-400 group"
                      >
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-bold text-gray-700 group-hover:text-red-600 transition-colors line-clamp-2">{notif.mensagem}</p>
                          <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase font-black">Admin</span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-2">
                          {new Date(notif.created_at).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                        </p>
                      </div>
                    ))}

                    {/* Pending Tasks (System Generated) */}
                    {pendingTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleNotificationClick(task)}
                        className="p-4 hover:bg-orange-50/50 cursor-pointer transition-colors group"
                      >
                        <p className="text-sm font-bold text-gray-700 group-hover:text-orange-600 transition-colors">{task.title}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            {new Date(task.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-orange-100/50">
              <div className="flex flex-col items-end hidden md:flex">
                <span className="text-xs font-bold text-gray-900 leading-tight">
                  {user.name}
                </span>
                <span className="text-[10px] font-medium text-gray-400 leading-tight">
                  {user.role}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl"
              >
                Sair
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
