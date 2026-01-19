import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { TrendingDown, Calendar, Clock, MapPin, Search, Filter } from 'lucide-react';
import { warehouseApi } from '@/api/warehouse';
import Loading from '@/components/ui/Loading';
import Input from '@/components/ui/Input';

export const AdminLossDashboard: React.FC = () => {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSource, setFilterSource] = useState('ALL');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await warehouseApi.getLossHistory();
            setHistory(data);
        } catch (error) {
            console.error("Erro ao carregar histórico de perdas:", error);
        } finally {
            setLoading(false);
        }
    };

    const isToday = (dateStr: string) => {
        const d = new Date(dateStr);
        const today = new Date();
        return d.getDate() === today.getDate() &&
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear();
    };

    const isThisWeek = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        return d >= startOfWeek;
    };

    const isThisMonth = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    };

    const stats = {
        today: history.filter(h => isToday(h.date)).reduce((acc, h) => acc + h.quantity, 0),
        week: history.filter(h => isThisWeek(h.date)).reduce((acc, h) => acc + h.quantity, 0),
        month: history.filter(h => isThisMonth(h.date)).reduce((acc, h) => acc + h.quantity, 0)
    };

    const filteredHistory = history.filter(h => {
        const matchesSearch = h.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            h.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
            h.reason.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterSource === 'ALL' || h.source === filterSource;
        return matchesSearch && matchesFilter;
    });

    if (loading) return <Loading message="Carregando dados de perdas..." />;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-red-50">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-100 text-red-600 rounded-xl shadow-sm">
                        <TrendingDown size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Perdas & Consumo Interno</h1>
                        <p className="text-gray-500 text-sm font-medium">Monitoramento global de quebras, avarias e consumo.</p>
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <Input
                            placeholder="Buscar registros..."
                            className="pl-10 h-11"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="h-11 border rounded-xl px-3 bg-gray-50 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-red-200"
                        value={filterSource}
                        onChange={(e) => setFilterSource(e.target.value)}
                    >
                        <option value="ALL">Todas Fontes</option>
                        <option value="Produção">Produção</option>
                        <option value="Armazém">Armazém</option>
                        <option value="Campo">Campo (Mortalidade)</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
                    <div className="h-1.5 bg-gray-200 w-full"></div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black text-gray-500 uppercase tracking-widest">Perdas Hoje</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-gray-900 group-hover:scale-105 transition-transform origin-left">{stats.today.toLocaleString()}</div>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 flex items-center gap-1">
                            <Clock size={10} /> Registros nas últimas 24h
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
                    <div className="h-1.5 bg-orange-400 w-full"></div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black text-orange-600/70 uppercase tracking-widest">Perdas na Semana</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-orange-600 group-hover:scale-105 transition-transform origin-left">{stats.week.toLocaleString()}</div>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 flex items-center gap-1">
                            <Calendar size={10} /> Acumulado dos últimos 7 dias
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
                    <div className="h-1.5 bg-red-500 w-full"></div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black text-red-600/70 uppercase tracking-widest">Perdas no Mês</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-red-600 group-hover:scale-105 transition-transform origin-left">{stats.month.toLocaleString()}</div>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 flex items-center gap-1">
                            <Filter size={10} /> Total acumulado no mês atual
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="border-b border-gray-50">
                    <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Calendar size={18} className="text-gray-400" />
                        Histórico de Eventos
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50/50 text-gray-500 font-black text-[10px] uppercase tracking-widest border-b border-gray-100">
                                <tr>
                                    <th className="p-4 pl-6">Data / Hora</th>
                                    <th className="p-4">Tipo de Evento</th>
                                    <th className="p-4">Origem / Local</th>
                                    <th className="p-4">Fonte</th>
                                    <th className="p-4 text-center">Quantidade</th>
                                    <th className="p-4 pr-6">Motivo / Notas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredHistory.map((item) => (
                                    <tr key={item.id} className="hover:bg-red-50/20 transition-colors group">
                                        <td className="p-4 pl-6">
                                            <div className="font-bold text-gray-900">{new Date(item.date).toLocaleDateString()}</div>
                                            <div className="text-[10px] text-gray-400 font-medium">
                                                {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${item.type.includes('Consumo')
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-red-100 text-red-700'
                                                }`}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-gray-700 font-medium">
                                                <MapPin size={12} className="text-gray-400" />
                                                {item.origin}
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-500 font-bold text-xs">{item.source}</td>
                                        <td className="p-4 text-center font-black text-gray-900 text-lg">
                                            {item.quantity}
                                        </td>
                                        <td className="p-4 pr-6 text-gray-500 text-xs italic group-hover:text-gray-900 transition-colors">
                                            {item.reason}
                                        </td>
                                    </tr>
                                ))}
                                {filteredHistory.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center">
                                            <div className="flex flex-col items-center gap-2 opacity-20">
                                                <TrendingDown size={48} />
                                                <p className="font-black uppercase tracking-widest">Nenhum registro encontrado</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
