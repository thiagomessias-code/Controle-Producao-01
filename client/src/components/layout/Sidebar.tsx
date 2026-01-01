import { useLocation } from "wouter";
import { useAppStore } from "@/hooks/useAppStore";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: "Home", path: "/", icon: "🏠" },
  { label: "Aviários", path: "/aviaries", icon: "🏭" },
  { label: "Produção", path: "/production", icon: "📊" },
  { label: "Incubação", path: "/incubation", icon: "🥚" },
  { label: "Caixa de Crescimento", path: "/batches/growth", icon: "🐣" },
  { label: "Armazém", path: "/warehouse", icon: "📦" },
  { label: "Alimentação", path: "/feed", icon: "🌾" },
  { label: "Vendas", path: "/sales", icon: "💰" },
  { label: "Perfil", path: "/profile", icon: "👤" },
];

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { sidebarOpen, setSidebarOpen } = useAppStore();

  return (
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-64px)] bg-white border-r border-orange-100/50 transition-all duration-300 z-30 shadow-[4px_0_20px_-10px_rgba(249,115,22,0.1)] ${sidebarOpen ? "w-64" : "w-0"
        } flex flex-col overflow-hidden`}
    >
      <ScrollArea className="flex-1 h-full">
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                setLocation(item.path);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group active:scale-95 ${location === item.path
                ? "bg-[#f97316] text-white shadow-lg shadow-orange-200"
                : "text-gray-500 hover:bg-orange-50 hover:text-orange-600"
                }`}
            >
              <div className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${location === item.path ? "bg-white/20" : "bg-gray-50 group-hover:bg-white"}`}>
                <span className="text-lg">{item.icon}</span>
              </div>
              <span className={`font-bold text-sm tracking-tight text-left ${location === item.path ? "text-white" : "text-gray-600 group-hover:text-orange-700"}`}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </ScrollArea>

      <div className="p-6 opacity-30 mt-auto">
        <div className="h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent mb-4"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-center text-orange-900">
          Versão 2.1.0-O
        </p>
      </div>
    </aside>
  );
}
