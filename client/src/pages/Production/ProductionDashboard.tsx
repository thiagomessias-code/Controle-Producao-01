import { useState } from "react";
import { useLocation } from "wouter";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Loading from "@/components/ui/Loading";
import { useCages } from "@/hooks/useCages";
import CageList from "./CageList";

export default function ProductionDashboard() {
    const [, setLocation] = useLocation();
    const { cages, isLoading, create, isCreating } = useCages();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        capacity: "",
    });

    const handleCreateCage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.capacity) return;

        try {
            await create({
                name: formData.name,
                capacity: parseInt(formData.capacity),
                status: "active",
            });
            setIsModalOpen(false);
            setFormData({ name: "", capacity: "" });
        } catch (error) {
            console.error("Erro ao criar gaiola:", error);
            alert("Erro ao criar gaiola.");
        }
    };

    if (isLoading) {
        return <Loading fullScreen message="Carregando produção..." />;
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100/50">
                        Monitoramento de Postura
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Produção de Ovos</h1>
                    <p className="text-gray-500 font-medium text-lg leading-relaxed">
                        Gestão operacional de <span className="text-orange-600 font-bold">gaiolas e lotes de poedeiras</span>.
                    </p>
                </div>
                <div className="flex gap-4">
                    <Button
                        variant="outline"
                        onClick={() => window.history.back()}
                        className="rounded-xl border-orange-100 text-orange-600 hover:bg-orange-50 font-bold"
                    >
                        ⬅️ Voltar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => setIsModalOpen(true)}
                        className="rounded-xl font-black shadow-lg shadow-orange-200"
                    >
                        + NOVA GAIOLA
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    {
                        title: "Total de Gaiolas",
                        value: cages.length,
                        icon: "🏠",
                        desc: "Unidades Habitacionais",
                        color: "orange"
                    },
                    {
                        title: "Capacidade Total",
                        value: cages.reduce((acc, cage) => acc + cage.capacity, 0),
                        icon: "📊",
                        desc: "Alojamento Máximo",
                        color: "orange"
                    },
                    {
                        title: "Aves em Produção",
                        value: cages.reduce((acc, cage) => acc + cage.currentQuantity, 0),
                        icon: "🪶",
                        desc: "Plantel Ativo (Postura)",
                        color: "orange"
                    }
                ].map((stat, i) => (
                    <Card key={i} className="hover:shadow-2xl hover:shadow-orange-200/50 hover:-translate-y-2 transition-all duration-300 border-none relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-full -mr-12 -mt-12 opacity-50 group-hover:bg-orange-100 transition-colors"></div>
                        <CardHeader className="pb-2 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-50 rounded-xl shadow-inner group-hover:bg-white transition-colors">
                                    <span className="text-xl">{stat.icon}</span>
                                </div>
                                <CardTitle className="text-gray-400 text-xs font-black uppercase tracking-[0.2em]">{stat.title}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="flex flex-col">
                                <p className="text-4xl font-black text-gray-900 tracking-tighter tabular-nums">{stat.value}</p>
                                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mt-1 opacity-70">{stat.desc}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <CageList cages={cages} />

            {isModalOpen && (
                <div className="fixed inset-0 bg-orange-950/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <Card className="w-full max-w-md border-none shadow-2xl overflow-hidden rounded-[2rem]">
                        <div className="h-2 bg-gradient-to-r from-orange-400 to-orange-600"></div>
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-2xl font-black text-gray-900 uppercase tracking-tight">Nova Gaiola</CardTitle>
                            <CardDescription className="text-xs font-bold text-orange-600 uppercase tracking-widest mt-1">Setor de Postura</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 pt-0">
                            <form onSubmit={handleCreateCage} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Identificação</label>
                                    <Input
                                        placeholder="Ex: Gaiola A1"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        className="border-none bg-orange-50/30 font-bold py-6 px-4 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Capacidade de Alojamento</label>
                                    <Input
                                        type="number"
                                        placeholder="Ex: 50"
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                        required
                                        className="border-none bg-orange-50/30 font-bold py-6 px-4 rounded-xl"
                                    />
                                </div>
                                <div className="flex gap-3 pt-6">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="flex-1 py-6 rounded-2xl font-black text-lg shadow-xl shadow-orange-200"
                                        isLoading={isCreating}
                                    >
                                        CRIAR GAIOLA
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1 py-6 rounded-2xl font-black text-lg border-orange-100 text-orange-600 hover:bg-orange-50"
                                        onClick={() => setIsModalOpen(false)}
                                    >
                                        VOLTAR
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
