import { useLocation } from "wouter";
import { useAppStore } from "@/hooks/useAppStore";

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: "Home", path: "/", icon: "🏠" },
  { label: "Aviários", path: "/aviaries", icon: "🏭" },

  { label: "Incubação", path: "/incubation", icon: "🥚" },
  { label: "Caixas de Crescimento", path: "/batches/growth", icon: "📦" },
  { label: "Armazém", path: "/warehouse", icon: "🏭" },
  { label: "Alimentação", path: "/feed", icon: "🌾" },
  { label: "Vendas", path: "/sales", icon: "💰" },
  { label: "Perfil", path: "/profile", icon: "👤" },
];

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { sidebarOpen } = useAppStore();

  return (
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-64px)] bg-card border-r border-border transition-all duration-300 ${sidebarOpen ? "w-64" : "w-0"
        } overflow-hidden z-30`}
    >
      <nav className="p-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => setLocation(item.path)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location === item.path
              ? "bg-primary text-primary-foreground"
              : "text-foreground hover:bg-muted"
              }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
