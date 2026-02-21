import React, { useState, useEffect } from 'react';
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { supabase } from "@/api/supabaseClient";
import Button from "@/components/ui/Button";
import { useGroups } from "@/hooks/useGroups";
import { useProduction } from "@/hooks/useProduction";
import { useSales } from "@/hooks/useSales";
import { useBatches } from "@/hooks/useBatches";
import TodoList from "@/components/TodoList";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useAppStore } from "@/hooks/useAppStore";
import { useIncubation } from "@/hooks/useIncubation";
import { getDaysDifference } from "@/utils/date";
import { formatQuantity, formatCurrency } from "@/utils/format";
import { useFeed } from "@/hooks/useFeed";
import {
  AlertTriangle,
  LayoutDashboard,
  Thermometer,
  Droplets,
  Plus,
  Wind,
  ClipboardList,
  Egg,
  TrendingUp,
  Package,
  Wheat,
  BadgeDollarSign
} from "lucide-react";

const quickActions = [
  {
    label: "Registrar Produção",
    path: "/production/register",
    icon: "📊",
    color: "bg-emerald-500",
    lightColor: "bg-emerald-50",
    textColor: "text-emerald-600"
  },
  {
    label: "Registrar Venda",
    path: "/sales/register",
    icon: "💰",
    color: "bg-amber-500",
    lightColor: "bg-amber-50",
    textColor: "text-amber-600"
  },
  {
    label: "Abastecer Silo",
    path: "/abastecer-silo",
    icon: "🚜",
    color: "bg-blue-500",
    lightColor: "bg-blue-50",
    textColor: "text-blue-600"
  },
  {
    label: "Registrar Incubação",
    path: "/incubation/create",
    icon: "🥚",
    color: "bg-orange-500",
    lightColor: "bg-orange-50",
    textColor: "text-orange-600"
  },
  {
    label: "Registrar Abatimentos",
    path: "/mortality/register",
    icon: "⚠️",
    color: "bg-rose-500",
    lightColor: "bg-rose-50",
    textColor: "text-rose-600"
  },
  {
    label: "Registrar Alimentação",
    path: "/feed",
    icon: "🌾",
    color: "bg-yellow-500",
    lightColor: "bg-yellow-50",
    textColor: "text-yellow-600"
  },
  {
    label: "Caixas de Crescimento",
    path: "/groups/growth",
    icon: "📦",
    color: "bg-sky-500",
    lightColor: "bg-sky-50",
    textColor: "text-sky-600"
  },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { groups } = useGroups();
  const { productions } = useProduction();
  const { sales } = useSales();
  const { batches } = useBatches();
  const { permission, requestPermission, sendNotification } = useNotifications();
  const { incubations } = useIncubation();
  const { feeds } = useFeed();
  console.log("DEBUG: Home rendering. Groups:", groups?.length, "Batches:", batches?.length);

  const [filterType, setFilterType] = useState<'today' | 'week' | 'month' | 'all'>('all');

  const safeGroups = Array.isArray(groups) ? groups : [];

  const filterByDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();

    // Normalize to compare only dates
    const normalizeDate = (d: Date) => {
      const nd = new Date(d);
      nd.setHours(0, 0, 0, 0);
      return nd.getTime();
    };

    const targetTime = normalizeDate(date);
    const nowTime = normalizeDate(now);

    if (filterType === 'today') {
      return targetTime === nowTime;
    }
    if (filterType === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return targetTime >= normalizeDate(weekAgo) && targetTime <= nowTime;
    }
    if (filterType === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return targetTime >= normalizeDate(monthStart);
    }
    return true;
  };

  const filteredSales = (Array.isArray(sales) ? sales : []).filter(s => filterByDate(s.date));
  const filteredProductions = (Array.isArray(productions) ? productions : []).filter(p => filterByDate(p.date));

  // Filter for active groups only for the dashboard
  const activeGroups = safeGroups.filter((g: any) => g.status === "active");

  const totalRevenue = filteredSales.reduce((acc: number, sale: any) => acc + sale.totalPrice, 0);
  const totalProduction = filteredProductions.reduce((acc: number, prod: any) => acc + prod.quantity, 0);

  // Count birds only from active groups
  const totalBirds = activeGroups.reduce((acc: number, g: any) => acc + g.quantity, 0);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto px-6 py-8">
        <div className="lg:col-span-2 space-y-10">
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100/50">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                </span>
                Painel Principal
              </div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                Olá, {user?.name?.split(' ')[0] || "Usuário"}! <span className="animate-bounce inline-block">👋</span>
              </h1>
              <p className="text-gray-500 font-medium text-lg max-w-md leading-relaxed">
                Bem-vindo à excelência na gestão das <span className="text-orange-600 font-bold">Codornas do Sertão</span>.
              </p>
            </div>

          </div>

          {/* Welcome Section */}
          {(() => {
            const readyToHatch = (incubations || []).filter((inc: any) => {
              const hasTransferred = inc.history?.some((h: any) => h.event.includes("Transferência"));
              if (hasTransferred) return false;
              if (inc.status !== "incubating") return false;
              const days = getDaysDifference(new Date(inc.startDate), new Date());
              return days >= 21;
            });
            if (readyToHatch.length === 0) return null;

            return (
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 shadow-xl shadow-orange-200 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 text-8xl opacity-10 rotate-12 transition-transform group-hover:rotate-0 duration-500">🐣</div>
                <div className="relative z-10">
                  <h3 className="text-xl font-black text-white flex items-center gap-2 mb-2">
                    Eclosão Prevista! 🥚
                  </h3>
                  <p className="text-orange-100 font-medium mb-6 max-w-md">
                    Você tem {readyToHatch.length} lote(s) com 21 dias ou mais prontos para transferência.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {readyToHatch.map((inc: any) => (
                      <div key={inc.id} className="flex justify-between items-center bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20 hover:bg-white/20 transition-all cursor-pointer" onClick={() => setLocation(`/incubation/${inc.id}`)}>
                        <span className="font-bold text-white tracking-wide">{inc.batchNumber}</span>
                        <span className="text-xs bg-white text-orange-600 px-2 py-1 rounded-lg font-black uppercase">Ver Lote</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Quick Actions - Grid Layout */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 ml-1">
              <div className="w-1.5 h-4 bg-orange-600 rounded-full"></div>
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Ações Rápidas de Gestão</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              {quickActions.map((action) => (
                <button
                  key={action.path}
                  onClick={() => setLocation(action.path)}
                  className="bg-white border-2 border-gray-50 rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-5 hover:shadow-2xl hover:shadow-orange-200/40 hover:-translate-y-2 transition-all duration-500 group active:scale-95 text-center h-full relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-24 h-24 ${action.lightColor} rounded-full -mr-12 -mt-12 opacity-0 group-hover:opacity-20 transition-opacity duration-500`}></div>

                  <div className={`w-20 h-20 ${action.lightColor} group-hover:${action.color} ${action.textColor} group-hover:text-white rounded-[1.75rem] flex items-center justify-center transition-all duration-500 shadow-inner group-hover:shadow-2xl group-hover:rotate-6 text-4xl`}>
                    {action.icon}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[13px] font-black text-gray-900 group-hover:text-orange-600 transition-colors uppercase tracking-tight leading-none block">
                      {action.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="space-y-4">
            <div className="flex justify-start">
              <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm w-fit">
                {[
                  { id: 'today', label: 'Hoje' },
                  { id: 'week', label: 'Semana' },
                  { id: 'month', label: 'Mês' },
                  { id: 'all', label: 'Total' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilterType(f.id as any)}
                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === f.id
                      ? 'bg-orange-600 text-white shadow-lg shadow-orange-100'
                      : 'text-gray-400 hover:text-gray-600'
                      }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { label: "Grupos Ativos", val: activeGroups.length, sub: `${activeGroups.filter((g: any) => g.phase === "crescimento").length} crescimento`, icon: "🏢" },
                { label: "Total de Aves", val: formatQuantity(totalBirds), sub: `Em ${activeGroups.length} grupos`, icon: "🐦" },
                { label: "Produção Período", val: formatQuantity(totalProduction), sub: `${filteredProductions.length} registros`, icon: "📊" },
                { label: "Receita Período", val: formatCurrency(totalRevenue), sub: `${filteredSales.length} vendas`, icon: "💰" }
              ].map((stat, i) => (
                <Card key={i} className="group hover:-translate-y-1">
                  <CardContent className="pt-6 relative overflow-hidden">
                    <div className="absolute -top-2 -right-2 text-4xl opacity-5 group-hover:rotate-12 group-hover:scale-110 transition-all">{stat.icon}</div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-3xl font-black text-gray-900 group-hover:text-orange-600 transition-colors">{stat.val}</p>
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-50">
                      <div className="w-1 h-1 rounded-full bg-orange-500"></div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                        {stat.sub}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Groups (Production Only) */}
            {activeGroups.filter((g: any) => g.phase !== "crescimento").length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">Lotes de Postura Recentes</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation("/groups")}
                  >
                    Ver Todos
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeGroups
                    .filter((g: any) => g.phase !== "crescimento")
                    .slice(0, 3)
                    .map((group: any) => {
                      const activeBatch = (batches || []).find(b => b.galpao_id === group.id && b.status === 'active');
                      return (
                        <Card
                          key={group.id}
                          className="hover:shadow-lg transition-shadow cursor-pointer"
                          onClick={() => {
                            console.log(`DEBUG: Clicking card for group ${group.name} (${group.id}). Found active batch:`, activeBatch?.id);
                            if (activeBatch) {
                              setLocation(`/batches/${activeBatch.id}`);
                            } else {
                              setLocation(`/groups/${group.id}`);
                            }
                          }}
                        >
                          <CardHeader>
                            <CardTitle className="text-lg">{group.name}</CardTitle>
                            <CardDescription>{group.species}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Quantidade:</span>
                                <span className="font-semibold text-primary">
                                  {formatQuantity(group.quantity)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Fase:</span>
                                <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                  Postura
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Local:</span>
                                <span className="text-sm font-medium">{group.location}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </div>
            )
            }

            {/* Recent Growth Boxes */}
            {
              activeGroups.filter((g: any) => g.phase === "crescimento").length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-foreground">Caixas de Crescimento Recentes</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation("/groups/growth")}
                    >
                      Ver Todas
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeGroups
                      .filter((g: any) => g.phase === "crescimento")
                      .slice(0, 3)
                      .map((group: any) => {
                        const activeBatch = (batches || []).find(b => b.galpao_id === group.id && b.status === 'active');
                        return (
                          <Card
                            key={group.id}
                            className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-500"
                            onClick={() => {
                              console.log(`DEBUG: Clicking card for growth group ${group.name} (${group.id}). Found active batch:`, activeBatch?.id);
                              if (activeBatch) {
                                setLocation(`/batches/${activeBatch.id}`);
                              } else {
                                setLocation(`/groups/${group.id}`);
                              }
                            }}
                          >
                            <CardHeader>
                              <CardTitle className="text-lg">{group.name}</CardTitle>
                              <CardDescription>{group.species}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">Quantidade:</span>
                                  <span className="font-semibold text-primary">
                                    {formatQuantity(group.quantity)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">Fase:</span>
                                  <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    Crescimento
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">Local:</span>
                                  <span className="text-sm font-medium">{group.location}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                </div>
              )
            }

            {/* Empty State */}
          </div>
          <div className="lg:col-span-1 space-y-8">
            <Card className="border-none shadow-xl shadow-orange-100/30 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-16 -mt-16 opacity-50 z-0"></div>
              <CardHeader className="pb-4 relative z-10 border-none">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <CardTitle className="text-lg font-black text-gray-900 leading-tight">Atividade Recente</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Registros do Sistema</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-6">
                  {/* Feeds Recentes */}
                  {(() => {
                    const recentFeeds = (feeds || []).slice(0, 3);
                    if (recentFeeds.length === 0) return null;
                    return (
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] ml-1">Alimentação</h4>
                        <div className="space-y-2">
                          {recentFeeds.map(f => (
                            <div key={f.id} className="flex gap-4 p-3 rounded-xl hover:bg-orange-50 transition-all duration-300 group cursor-default border border-transparent hover:border-orange-100/50">
                              <div className="w-10 h-10 bg-orange-50 group-hover:bg-white text-orange-600 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors shadow-sm">🌾</div>
                              <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <p className="text-sm font-bold text-gray-800 truncate group-hover:text-orange-700 transition-colors">{f.feedTypeName || 'Ração'}</p>
                                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-tight">{f.quantity}kg • {new Date(f.date).toLocaleDateString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Produção Recente */}
                  {productions.length > 0 && (
                    <div className="space-y-4 pt-2">
                      <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] ml-1">Produção</h4>
                      <div className="space-y-2">
                        {productions.slice(0, 3).map(p => (
                          <div key={p.id} className="flex gap-4 p-3 rounded-xl hover:bg-orange-50 transition-all duration-300 group cursor-default border border-transparent hover:border-orange-100/50">
                            <div className="w-10 h-10 bg-orange-50 group-hover:bg-white text-orange-600 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors shadow-sm">📊</div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <p className="text-sm font-bold text-gray-800 truncate group-hover:text-orange-700 transition-colors">{p.quantity} ovos</p>
                              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-tight">{new Date(p.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <TodoList />
          </div>
          {safeGroups.length === 0 && (
            <div className="text-center py-12 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-foreground mb-4">Bem-vindo à Fazenda! 🚀</p>
              <p className="text-muted-foreground mb-6">
                Acompanhe a produção e gerencie os lotes ativos.
              </p>
            </div>
          )}
        </div>
      </div>
      );
}

      function FeedActivity() {
  const {feeds} = useFeed();
      const recentFeeds = (feeds || []).slice(0, 3);

      if (recentFeeds.length === 0) return null;

      return (
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Alimentação</h4>
        {recentFeeds.map(f => (
          <div key={f.id} className="flex gap-3 text-sm p-2 rounded hover:bg-gray-50 transition-colors">
            <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded flex items-center justify-center flex-shrink-0">🌾</div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{f.feedTypeName || 'Ração'}</p>
              <p className="text-xs text-gray-500">{f.quantity}kg • {new Date(f.date).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
      );
}
