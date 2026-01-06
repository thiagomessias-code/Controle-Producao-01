import { ReactNode } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useAppStore } from "@/hooks/useAppStore";

interface AppContainerProps {
  children: ReactNode;
}

export default function AppContainer({ children }: AppContainerProps) {
  const { sidebarOpen, setSidebarOpen } = useAppStore();

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <Header />
      <Sidebar />

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-20 md:hidden animate-in fade-in duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main
        className={`transition-all duration-300 ${sidebarOpen ? "md:ml-64" : "ml-0"
          } pt-16 min-h-screen`}
      >
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
