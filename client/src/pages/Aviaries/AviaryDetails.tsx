import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Loading from "@/components/ui/Loading";
import { aviariesApi, Aviary } from "@/api/aviaries";
import { useGroups } from "@/hooks/useGroups";
import { formatQuantity } from "@/utils/format";

export default function AviaryDetails() {
    const [, setLocation] = useLocation();
    const [, params] = useRoute("/aviaries/:id");
    const aviaryId = params?.id || "";

    const [aviary, setAviary] = useState<Aviary | null>(null);
    const [loadingAviary, setLoadingAviary] = useState(true);

    const { groups, isLoading: groupsLoading } = useGroups();

    useEffect(() => {
        const loadAviary = async () => {
            if (!aviaryId) return;
            try {
                const data = await aviariesApi.getById(aviaryId);
                setAviary(data);
            } catch (error) {
                console.error("Failed to load aviary", error);
            } finally {
                setLoadingAviary(false);
            }
        };
        loadAviary();
    }, [aviaryId]);

    if (loadingAviary || groupsLoading) {
        return <Loading fullScreen message="Carregando detalhes do aviário..." />;
    }

    if (!aviary) {
        return <div className="p-8 text-center">Aviário não encontrado</div>;
    }

    // Filter groups belonging to this aviary
    const aviaryGroups = (groups || []).filter(g => g.aviaryId === aviaryId);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">{aviary.name}</h1>
                    <p className="text-muted-foreground mt-1">
                        {aviary.location} - {aviary.status === 'active' ? 'Ativo' : 'Inativo'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setLocation("/aviaries")}>
                        Voltar
                    </Button>
                </div>
            </div>

            <div>
                <h2 className="text-xl font-bold text-foreground mb-4">Grupos / Setores</h2>

                {aviaryGroups.length === 0 ? (
                    <div className="text-center py-12 bg-muted/50 rounded-lg">
                        <p className="text-muted-foreground">Nenhum grupo encontrado neste aviário.</p>
                        <p className="text-xs text-muted-foreground mt-1">(Os grupos são criados pelo ADMIN)</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {aviaryGroups.map((group) => (
                            <Card
                                key={group.id}
                                className={`hover:shadow-xl transition-all duration-300 cursor-pointer border-l-4 transform hover:-translate-y-1 ${group.type === 'production' ? 'border-l-pink-500 hover:bg-pink-50/30' :
                                    group.type === 'males' ? 'border-l-blue-500 hover:bg-blue-50/30' :
                                        'border-l-purple-500 hover:bg-purple-50/30'
                                    }`}
                                onClick={() => setLocation(`/groups/${group.id}`)}
                            >
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${group.type === 'production' ? 'bg-pink-100 text-pink-600' :
                                                group.type === 'males' ? 'bg-blue-100 text-blue-600' :
                                                    'bg-purple-100 text-purple-600'
                                                }`}>
                                                {group.type === 'production' ? '🥚' :
                                                    group.type === 'males' ? '🐓' : '🧬'}
                                            </div>
                                            <CardTitle className="text-xl font-bold text-gray-800">{group.name}</CardTitle>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${group.type === 'production' ? 'bg-pink-100 text-pink-800' :
                                            group.type === 'males' ? 'bg-blue-100 text-blue-800' :
                                                'bg-purple-100 text-purple-800'
                                            }`}>
                                            {group.type === 'production' ? 'Produção' :
                                                group.type === 'males' ? 'Machos' : 'Reprodutoras'}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4 mt-2">
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            {group.description || "Setor de produção avícola."}
                                        </p>

                                        <div className="space-y-2 pt-2 border-t border-gray-100">
                                            <div className="flex justify-between items-end mb-1">
                                                <div>
                                                    <p className="text-xs text-gray-500 font-medium uppercase">Ocupação</p>
                                                    <p className="text-lg font-bold text-gray-900">
                                                        {formatQuantity(group.quantity || 0)} <span className="text-xs text-gray-400 font-normal">/ {formatQuantity(group.capacity || 0)} aves</span>
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-xs font-bold ${((group.quantity || 0) / (group.capacity || 1)) >= 0.9 ? 'text-red-600' : 'text-green-600'}`}>
                                                        {(((group.quantity || 0) / (group.capacity || 1)) * 100).toFixed(1)}%
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className={`h-1.5 rounded-full transition-all duration-500 ${((group.quantity || 0) / (group.capacity || 1)) >= 0.9 ? "bg-red-500" :
                                                        ((group.quantity || 0) / (group.capacity || 1)) >= 0.7 ? "bg-amber-500" : "bg-green-500"
                                                        }`}
                                                    style={{ width: `${Math.min(((group.quantity || 0) / (group.capacity || 1)) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex items-center justify-end text-blue-600 text-xs font-bold group-hover:translate-x-1 transition-transform pt-1">
                                                Gerenciar Gaiolas ➡️
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div >
    );
}
