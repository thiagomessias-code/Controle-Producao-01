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

                                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                            <div className="text-xs text-gray-500 font-medium">
                                                Capacidade: <span className="text-gray-900 font-bold text-sm">{formatQuantity(group.capacity || 0)}</span>
                                            </div>
                                            <div className="flex items-center text-blue-600 text-sm font-bold group-hover:translate-x-1 transition-transform">
                                                Ver Gaiolas ➡️
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
