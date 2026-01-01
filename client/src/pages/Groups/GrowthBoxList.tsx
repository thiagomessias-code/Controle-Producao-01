import { useState } from "react";
import { useLocation } from "wouter";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useQuery } from "@tanstack/react-query";
import { caixasApi } from "@/api/caixas";
import { formatQuantity } from "@/utils/format";
import { getDaysDifference } from "@/utils/date";
import { Package, History, ArrowRight, Activity, Calendar } from "lucide-react";

export default function GrowthBoxList() {
    const [, setLocation] = useLocation();
    const [searchTerm, setSearchTerm] = useState("");
    const [showEmpty, setShowEmpty] = useState(true);

    const { data: caixas = [], isLoading } = useQuery({
        queryKey: ['growth-boxes-list'],
        queryFn: caixasApi.getAll
    });

    console.log('[GrowthBoxList] Render Caixas:', caixas);

    // Filter boxes
    const filteredBoxes = caixas.filter((box: any) => {
        // Search filter
        if (searchTerm && !box.name.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }

        // Status filter (Active/Maintenance/Inactive) - usually we show active in this list
        if (box.status !== 'active') return false;

        // "Empty" filter if needed could go here, but usually we want to see everything or toggle
        return true;
    });

    if (isLoading) {
        return <div className="p-8 text-center">Carregando caixas...</div>;
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100/50">
                        Fase de Desenvolvimento (Recria)
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Caixas de Crescimento</h1>
                    <p className="text-gray-500 font-medium text-lg leading-relaxed">
                        Gestão de <span className="text-orange-600 font-bold">aves jovens</span> em ambiente controlado.
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => window.history.back()}
                    className="rounded-xl border-orange-100 text-orange-600 hover:bg-orange-50 font-bold"
                >
                    ⬅️ Voltar
                </Button>
            </div>

            <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <span className="text-orange-300 group-focus-within:text-orange-500 transition-colors">🔍</span>
                </div>
                <input
                    type="text"
                    placeholder="Buscar caixa específica..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 rounded-2xl border-none bg-white shadow-xl shadow-orange-100/30 text-gray-900 font-bold placeholder:text-gray-300 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                />
            </div>

            {filteredBoxes.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-orange-100 rounded-[2rem] p-16 text-center">
                    <div className="text-6xl mb-6 grayscale opacity-20">📦</div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">Nenhuma caixa disponível</h3>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-8">Novas caixas devem ser configuradas pelo administrador</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredBoxes.map((box: any) => {
                        const activeBatches = box.lotes?.filter((l: any) => l.status === 'active') || [];
                        const isAvailable = activeBatches.length === 0;

                        return (
                            <Card
                                key={box.id}
                                className={`hover:shadow-2xl hover:shadow-orange-200/50 hover:-translate-y-2 transition-all duration-300 border-none relative overflow-hidden group ${isAvailable ? 'bg-orange-50/20' : 'bg-white'}`}
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-16 -mt-16 opacity-30 group-hover:bg-orange-100 transition-colors duration-500"></div>

                                <CardHeader className="relative z-10 pb-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm ${isAvailable ? 'bg-white text-orange-400 border-orange-100' : 'bg-orange-600 text-white border-orange-600'
                                            }`}>
                                            {isAvailable ? 'Vazia' : `${activeBatches.length} Lote(s) Ativo(s)`}
                                        </span>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Capacidade</p>
                                            <p className="text-xs font-black text-gray-500 uppercase">{box.capacidade} AVES</p>
                                        </div>
                                    </div>
                                    <CardTitle className="text-2xl font-black text-gray-900 group-hover:text-orange-600 transition-colors uppercase tracking-tight">
                                        {box.name}
                                    </CardTitle>
                                    <div className="flex items-center gap-2 pt-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">
                                            📍 {box.aviarios?.nome} {box.aviarios?.cidade ? `- ${box.aviarios.cidade}` : ''}
                                        </p>
                                    </div>
                                </CardHeader>

                                <CardContent className="relative z-10 space-y-6">
                                    {!isAvailable ? (
                                        <div className="space-y-4">
                                            {activeBatches.map((batch: any, bIdx: number) => {
                                                const age = batch.birthDate
                                                    ? getDaysDifference(new Date(batch.birthDate), new Date())
                                                    : 0;
                                                const daysLeft = 35 - age;

                                                return (
                                                    <div
                                                        key={batch.id}
                                                        className="p-5 rounded-[1.5rem] bg-orange-50/50 border border-orange-100/50 hover:bg-orange-50 transition-colors group/lote"
                                                    >
                                                        <div className="flex justify-between items-center mb-4">
                                                            <div>
                                                                <p className="text-[10px] font-black text-orange-900/40 uppercase tracking-widest">Identificador</p>
                                                                <p className="text-sm font-black text-gray-900">Lote #{batch.batchNumber || 'S/N'}</p>
                                                            </div>
                                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter ${daysLeft <= 0 ? "bg-green-600 text-white" : "bg-white text-orange-600 border border-orange-100"}`}>
                                                                {daysLeft <= 0 ? 'MATURADO' : `${daysLeft}d p/ abate`}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-end justify-between">
                                                            <div>
                                                                <p className="text-[10px] font-black text-orange-900/40 uppercase tracking-widest mb-1">População Ativa</p>
                                                                <p className="text-2xl font-black text-gray-900 tabular-nums">
                                                                    {formatQuantity(batch.quantity)}
                                                                    <span className="text-[10px] ml-1 text-gray-400 font-bold uppercase">Aves</span>
                                                                </p>
                                                            </div>
                                                            <Button
                                                                variant="primary"
                                                                size="sm"
                                                                className="rounded-xl font-black shadow-md shadow-orange-100/50 flex items-center gap-2 group/btn px-4"
                                                                onClick={() => setLocation(`/batches/${batch.id}`)}
                                                            >
                                                                DETAILS
                                                                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                                                            </Button>
                                                        </div>

                                                        <div className="mt-4 pt-4 border-t border-orange-100/50 flex items-center gap-4">
                                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                                <Calendar className="w-3.5 h-3.5" />
                                                                {age} DIAS DE VIDA
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="py-12 text-center rounded-[2rem] border-2 border-dashed border-orange-100">
                                            <Package className="w-10 h-10 text-orange-100 mx-auto mb-3" />
                                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Gaiola disponível para novos lotes</p>
                                        </div>
                                    )}

                                    {(() => {
                                        const finishedBatches = box.lotes?.filter((l: any) => l.status !== 'active' && l.status !== 'ativo')
                                            .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                                            .slice(0, 2) || [];

                                        if (finishedBatches.length === 0) return null;

                                        return (
                                            <div className="pt-4 border-t border-orange-50">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <History className="w-3.5 h-3.5 text-orange-300" />
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recém Desocupada</p>
                                                </div>
                                                <div className="space-y-2">
                                                    {finishedBatches.map((fb: any) => (
                                                        <div
                                                            key={fb.id}
                                                            className="flex justify-between items-center p-3 rounded-xl bg-gray-50/50 hover:bg-orange-50 transition-colors cursor-pointer group/history"
                                                            onClick={() => setLocation(`/batches/${fb.id}`)}
                                                        >
                                                            <span className="text-[11px] font-black text-gray-500 uppercase tracking-tighter truncate group-hover/history:text-orange-600 transition-colors">
                                                                Lote #{fb.batchNumber || 'S/N'}
                                                            </span>
                                                            <ArrowRight className="w-3 h-3 text-gray-300 group-hover/history:text-orange-400 group-hover/history:translate-x-1 transition-all" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
