import React, { ReactNode } from 'react';
import { useLocation } from "wouter";
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';
import {
    LayoutDashboard,
    MapPin,
    Home,
    Grid,
    Users,
    DollarSign,
    FileText,
    Package,
    Bell,
    Egg,
    TrendingDown
} from 'lucide-react';

// Inline Admin Sidebar Component
const AdminSidebar: React.FC = () => {
    const [location, setLocation] = useLocation();

    const adminNavItems = [
        { path: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { path: '/admin/aviarios', label: 'Aviários & Estrutura', icon: <MapPin size={20} /> },
        { path: '/admin/usuarios', label: 'Usuários', icon: <Users size={20} /> },
        { path: '/admin/financeiro', label: 'Financeiro', icon: <DollarSign size={20} /> },
        { path: '/admin/produtos', label: 'Produtos', icon: <Package size={20} /> },
        { path: '/admin/incubacao', label: 'Incubação', icon: <Egg size={20} /> },
        { path: '/admin/caixas-crescimento', label: 'Caixas Cresc.', icon: <Boxes size={20} /> },
        { path: '/admin/estoque', label: 'Estoque', icon: <Package size={20} /> },
        { path: '/admin/perdas-consumo', label: 'Perdas & Consumo', icon: <TrendingDown size={20} /> },
        { path: '/admin/alimentacao', label: 'Alimentação', icon: <Utensils size={20} /> },
        { path: '/admin/lotes', label: 'Lotes', icon: <Boxes size={20} /> },
        { path: '/admin/notificacoes', label: 'Notificações', icon: <Bell size={20} /> },
        { path: '/admin/custos', label: 'Gestão de Custos', icon: <DollarSign size={20} /> },
        { path: '/admin/relatorios', label: 'Relatórios IA', icon: <FileText size={20} /> }
    ];

    return (
        <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-white border-r border-border overflow-y-auto z-30 hidden md:block shadow-sm">
            <nav className="p-4 space-y-2">
                <div className="mb-6 px-4">
                    <h2 className="text-xs uppercase text-gray-500 font-bold tracking-wider">
                        Administração
                    </h2>
                </div>
                {adminNavItems.map((item) => {
                    const isActive = location === item.path || (item.path !== '/admin' && location.startsWith(item.path));
                    return (
                        <button
                            key={item.path}
                            onClick={() => setLocation(item.path)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${isActive
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                                : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                                }`}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/20 rounded-r-full"></div>
                            )}

                            <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                {item.icon}
                            </span>
                            <span className="font-medium tracking-wide text-sm">{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
};

interface AdminLayoutProps {
    children?: ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const { user, isLoading } = useAuth();
    const [, setLocation] = useLocation();

    if (isLoading) return <div className="flex justify-center items-center h-screen">Carregando...</div>;

    if (!user || user.role?.toLowerCase() !== 'admin') {
        // Redirect non-admins to home
        // setTimeout(() => setLocation('/'), 0);
        return <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h1>
            <p className="mb-4">Seu usuário ({user?.email}) não tem permissão de administrador.</p>
            <p className="text-sm text-gray-500">Role atual: {user?.role}</p>
        </div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <div className="flex flex-1 pt-16">
                <AdminSidebar />

                <main className="flex-1 md:ml-64 p-6 overflow-y-auto h-[calc(100vh-64px)]">
                    <div className="container mx-auto max-w-7xl">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
