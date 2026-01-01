import { useRoute, useLocation } from "wouter";
import { useGroups } from "@/hooks/useGroups";
import { useCages } from "@/hooks/useCages";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Loading from "@/components/ui/Loading";
import Input from "@/components/ui/Input";
import { formatQuantity } from "@/utils/format";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";

export default function GroupDetails() {
    const [, setLocation] = useLocation();
    const [, params] = useRoute("/groups/:id");
    const groupId = params?.id || "";

    const { groups, isLoading: groupsLoading } = useGroups();
    const group = groups?.find(g => g.id === groupId);

    const { cages, isLoading: cagesLoading, create, isCreating } = useCages();
    const groupCages = (cages || []).filter(c => c.groupId === groupId);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', capacity: '' });

    const handleSaveCage = async () => {
        if (!formData.name || !formData.capacity) return alert('Preencha os dados');
        try {
            await create({
                name: formData.name,
                capacity: parseInt(formData.capacity),
                groupId: groupId,
                type: group?.type as any || 'production',
                status: 'active'
            });
            setIsModalOpen(false);
            setFormData({ name: '', capacity: '' });
        } catch (error) {
            console.error(error);
            alert('Erro ao criar gaiola');
        }
    };

    if (groupsLoading || cagesLoading) {
        return <Loading fullScreen message="Carregando detalhes..." />;
    }

    if (!group) {
        return <div className="p-8 text-center">Galpão não encontrado</div>;
    }

    const totalCapacity = group.capacity;
    const currentOccupancy = groupCages.reduce((acc, cage) => acc + (cage.currentQuantity || 0), 0);
    const occupancyRate = totalCapacity > 0 ? (currentOccupancy / totalCapacity) * 100 : 0;

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100/50">
                        {group.type === 'production' ? 'Unidade de Postura' : group.type === 'males' ? 'Setor de Machos' : 'Setor de Reprodutoras'}
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">{group.name}</h1>
                    <p className="text-gray-500 font-medium text-lg leading-relaxed">
                        Gestão detalhada de <span className="text-orange-600 font-bold">gaiolas e ocupação</span>.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setLocation("/aviaries")}
                        className="rounded-xl border-orange-100 text-orange-600 hover:bg-orange-50 font-bold"
                    >
                        Voltar para Aviários
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Capacidade Total", val: formatQuantity(totalCapacity), sub: "Aves suportadas", icon: "🏠" },
                    {
                        label: "Ocupação Atual",
                        val: formatQuantity(currentOccupancy),
                        sub: `${occupancyRate.toFixed(1)}% ocupado`,
                        icon: "🐦",
                        progress: true
                    },
                    { label: "Total de Gaiolas", val: groupCages.length, sub: "Unidades cadastradas", icon: "🏗️" }
                ].map((stat, i) => (
                    <Card key={i} className="group border-none shadow-xl shadow-orange-100/30">
                        <CardContent className="pt-6 relative overflow-hidden">
                            <div className="absolute -top-2 -right-2 text-4xl opacity-5 group-hover:rotate-12 transition-all">{stat.icon}</div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <div className="flex items-center gap-2">
                                <p className="text-3xl font-black text-gray-900 group-hover:text-orange-600 transition-colors uppercase">
                                    {stat.val}
                                </p>
                            </div>

                            {stat.progress ? (
                                <div className="mt-4 space-y-2">
                                    <div className="w-full bg-orange-50 rounded-full h-2 shadow-inner overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${occupancyRate > 90 ? "bg-red-500" : "bg-orange-600"}`}
                                            style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                        {stat.sub}
                                    </p>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-orange-50">
                                    <div className="w-1 h-1 rounded-full bg-orange-500"></div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                                        {stat.sub}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="space-y-6">
                <div className="flex items-center gap-3 ml-1">
                    <div className="w-1.5 h-6 bg-orange-600 rounded-full"></div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase">Gaiolas do Setor</h2>
                </div>

                {groupCages.length === 0 ? (
                    <div className="text-center py-16 bg-white border border-dashed border-orange-200 rounded-3xl">
                        <div className="text-4xl mb-4 opacity-20">🏗️</div>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Nenhuma gaiola cadastrada.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groupCages.map((cage) => (
                            <Card
                                key={cage.id}
                                className="hover:shadow-2xl hover:shadow-orange-200/50 hover:-translate-y-2 transition-all duration-300 cursor-pointer border-none relative overflow-hidden group"
                                onClick={() => setLocation(`/production/cages/${cage.id}`)}
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-full -mr-12 -mt-12 opacity-50 group-hover:bg-orange-100 transition-colors duration-500"></div>
                                <CardHeader className="pb-4 relative z-10 border-none">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-600 group-hover:text-white transition-all shadow-inner group-hover:shadow-lg group-hover:shadow-orange-200">
                                                🏗️
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl font-black text-gray-900 group-hover:text-orange-600 transition-colors">{cage.name}</CardTitle>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-0.5">Módulo de Produção</p>
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100/50 ${cage.status === 'active'
                                            ? 'bg-orange-600 text-white shadow-lg shadow-orange-200'
                                            : 'bg-gray-100 text-gray-400'
                                            }`}>
                                            {cage.status === 'active' ? 'Ativa' : 'Inativa'}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="relative z-10 pt-4">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ocupação</p>
                                                <p className="text-2xl font-black text-gray-900">
                                                    {formatQuantity(cage.currentQuantity)}
                                                    <span className="text-xs font-bold text-gray-300 ml-1">/{formatQuantity(cage.capacity)}</span>
                                                </p>
                                            </div>
                                            <div className="text-right space-y-1">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Saldo Livre</p>
                                                <p className="text-2xl font-black text-orange-600">
                                                    {formatQuantity(Math.max(0, cage.capacity - cage.currentQuantity))}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="w-full bg-orange-50 rounded-full h-2.5 overflow-hidden shadow-inner p-0.5">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 p-0.5 ${(cage.currentQuantity / cage.capacity) >= 0.9 ? "bg-red-500" :
                                                    (cage.currentQuantity / cage.capacity) >= 0.7 ? "bg-orange-400" : "bg-orange-600"
                                                    }`}
                                                style={{ width: `${Math.min((cage.currentQuantity / cage.capacity) * 100, 100)}%` }}
                                            ></div>
                                        </div>

                                        <div className="pt-4 border-t border-orange-50 flex items-center justify-between">
                                            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest group-hover:translate-x-1 transition-transform">Gerenciar Lotes</span>
                                            <svg className="w-4 h-4 text-orange-400 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
