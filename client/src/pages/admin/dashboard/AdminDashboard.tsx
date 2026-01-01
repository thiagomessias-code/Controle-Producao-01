import React, { useEffect, useState } from 'react';
import { useLocation } from "wouter";
import { useAuth } from '@/hooks/useAuth';
import {
    TrendingUp,
    Users,
    Package,
    AlertTriangle,
    DollarSign,
    Activity,
    Plus,
    FileText,
    Settings,
    Search,
    ChevronDown,
    ChevronRight,
    Home,
    Layers,
    LayoutGrid,
    MapPin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { supabaseClient, supabase } from '@/api/supabaseClient';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { aviariesApi, Aviary } from '@/api/aviaries';
import { groupsApi, Group } from '@/api/groups';
import { cagesApi, Cage } from '@/api/cages';

export const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const [, setLocation] = useLocation();
    const [data, setData] = useState<{
        aviarios: Aviary[],
        groups: Group[],
        cages: Cage[],
        warehouse: any[],
        recentSlaughter: any[],
        recentProduction: any[]
    }>({
        aviarios: [],
        groups: [],
        cages: [],
        warehouse: [],
        recentSlaughter: [],
        recentProduction: []
    });
    const [stats, setStats] = useState({
        pendingNotifications: 0,
        totalEggs: 0,
        meatStock: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [avs, grps, cgs, notifs, stck, sltr, prod] = await Promise.all([
                    aviariesApi.getAll(),
                    groupsApi.getAll(),
                    cagesApi.getAll(),
                    supabase.from('notificacoes').select('id', { count: 'exact' }).eq('lida', false),
                    supabase.from('estoque').select('*'),
                ]);

                const warehouseData = stck.data || [];
                const totalEggs = warehouseData.filter(i => i.type === 'egg').reduce((acc, i) => acc + (i.quantity || 0), 0);
                const meatStock = warehouseData.filter(i => i.type === 'meat').reduce((acc, i) => acc + (i.quantity || 0), 0);

                setData({
                    aviarios: avs || [],
                    groups: grps || [],
                    cages: cgs || [],
                    warehouse: warehouseData,
                    recentSlaughter: [],
                    recentProduction: []
                });

                setStats({
                    pendingNotifications: (notifs as any).count || 0,
                    totalEggs,
                    meatStock
                });
            } catch (error) {
                console.error('Erro ao carregar dados do dashboard:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const quickActions = [
        { label: "Novo Usuário", path: "/admin/usuarios", icon: <Plus className="w-6 h-6" />, color: "bg-blue-100 text-blue-700", hover: "hover:bg-blue-200" },
        { label: "Relatórios IA", path: "/admin/relatorios", icon: <FileText className="w-6 h-6" />, color: "bg-purple-100 text-purple-700", hover: "hover:bg-purple-200" },
        { label: "Financeiro", path: "/admin/financeiro", icon: <DollarSign className="w-6 h-6" />, color: "bg-green-100 text-green-700", hover: "hover:bg-green-200" },
        { label: "Alertas", path: "/admin/notificacoes", icon: <AlertTriangle className="w-6 h-6" />, color: "bg-orange-100 text-orange-700", hover: "hover:bg-orange-200" },
    ];

    // Stats calculations
    const totalBirds = data.cages.reduce((acc, c) => acc + (c.currentQuantity || 0), 0);
    const totalCapacity = data.cages.reduce((acc, c) => acc + (c.capacity || 0), 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            {/* DEBUG TAG - IMPOSSIBLE TO MISS */}
            <div className="bg-yellow-400 text-black p-4 rounded-2xl flex items-center justify-between shadow-lg border-4 border-black font-black uppercase tracking-tighter mb-4 animate-pulse">
                <span>⚠️ [AMBIENTE: NEW-BASE] - CABEÇALHO DE SINCRONIZAÇÃO ATIVO ⚠️</span>
                <span>VERSÃO ATUAL: V5</span>
            </div>
            {/* 1. Welcome Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        Bem-vindo, {user?.name?.split(' ')[0] || 'Administrador'}! 👋
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Gerencie sua granja e acompanhe a produção em tempo real. [V6 - SIDEBAR HIERARCHY]
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors">
                        <Search className="w-5 h-5 text-gray-600" />
                    </button>
                    <button className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors">
                        <Settings className="w-5 h-5 text-gray-600" />
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Gerar Relatório
                    </button>
                </div>
            </div>

            {/* 2. Quick Actions Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                    <button
                        key={index}
                        onClick={() => setLocation(action.path)}
                        className={`p-4 rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-3 text-center ${action.color} ${action.hover} shadow-sm hover:shadow-md active:scale-95`}
                    >
                        <div className="p-3 bg-white/60 rounded-full backdrop-blur-sm">
                            {action.icon}
                        </div>
                        <span className="font-semibold text-sm">{action.label}</span>
                    </button>
                ))}
            </div>

            {/* 3. Modern Stats Cards */}


            {/* 4. Warehouse & Inventory Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-none shadow-md bg-gradient-to-br from-white to-orange-50/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Package className="w-5 h-5 text-orange-600" />
                            Armazém de Ovos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-end">
                            <div>
                                <span className="text-4xl font-black text-gray-900">{stats.totalEggs}</span>
                                <span className="text-gray-400 font-bold ml-2">unidades</span>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-orange-600 uppercase tracking-widest">Estoque Atual</p>
                                <p className="text-[10px] text-gray-400">Total acumulado (Fértil + Mesa)</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-gradient-to-br from-white to-red-50/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Activity className="w-5 h-5 text-red-600" />
                            Produção de Carne
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-end">
                            <div>
                                <span className="text-4xl font-black text-gray-900">{stats.meatStock}</span>
                                <span className="text-gray-400 font-bold ml-2">unidades</span>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-red-600 uppercase tracking-widest">Abates em Estoque</p>
                                <p className="text-[10px] text-gray-400">Pronto para comercialização</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 5. Recent History (Slaughter & Production) - Moved to AdminLotes.tsx */}

            {/* 4. Hierarchy moved to Sidebar - Scalability improved */}
            <div className="bg-blue-50/50 border border-dashed border-blue-200 rounded-3xl p-8 text-center">
                <LayoutGrid className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900">Gerenciamento Centralizado</h3>
                <p className="text-gray-500 max-w-md mx-auto mt-2">
                    A estrutura de **Aviários, Grupos e Gaiolas** foi movida para a barra lateral para facilitar o acesso de qualquer página.
                </p>
            </div>

            {/* 5. AI Report Section */}
            <div className="mt-4">
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 shadow-xl text-white relative overflow-hidden group cursor-pointer hover:scale-[1.01] transition-transform duration-300" onClick={() => setLocation('/admin/relatorios')}>
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white/10 blur-3xl group-hover:bg-white/20 transition-colors"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 rounded-full bg-white/10 blur-3xl group-hover:bg-white/20 transition-colors"></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="space-y-2 max-w-2xl">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur-md border border-white/10 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                    IA Ativa
                                </span>
                                <span className="text-blue-100 text-sm font-medium">Análise em Tempo Real</span>
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight">Insights de Produção</h2>
                            <p className="text-blue-100/90 leading-relaxed text-lg">
                                "A produção global de ovos está estável. Recomendamos revisar os alertas pendentes na estrutura abaixo."
                            </p>
                        </div>
                        <div className="flex-shrink-0">
                            <button className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-xl font-bold shadow-lg transition-all transform hover:-translate-y-1 flex items-center gap-2">
                                Ver Detalhes
                                <TrendingUp className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};
