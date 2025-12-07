import { useRoute, useLocation } from "wouter";
import { useGroups } from "@/hooks/useGroups";
import { useCages } from "@/hooks/useCages";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Loading from "@/components/ui/Loading";
import { formatQuantity } from "@/utils/format";

export default function GroupDetails() {
    const [, setLocation] = useLocation();
    const [, params] = useRoute("/groups/:id");
    const groupId = params?.id || "";

    const { groups, isLoading: groupsLoading } = useGroups();
    const group = groups?.find(g => g.id === groupId);

    const { cages, isLoading: cagesLoading } = useCages();
    const groupCages = (cages || []).filter(c => c.groupId === groupId);

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
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">{group.name}</h1>
                    <p className="text-muted-foreground mt-1">
                        {group.type === 'production' ? 'Produção (Postura)' : group.type === 'males' ? 'Machos' : 'Reprodutoras'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setLocation("/groups")}>
                        Voltar
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Capacidade Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{formatQuantity(totalCapacity)}</p>
                        <p className="text-sm text-muted-foreground">Aves</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Ocupação Atual</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2">
                            <p className="text-2xl font-bold">{formatQuantity(currentOccupancy)}</p>
                            <span className={`text-sm font-medium ${occupancyRate > 90 ? 'text-red-600' : 'text-green-600'}`}>
                                ({occupancyRate.toFixed(1)}%)
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 overflow-hidden">
                            <div
                                className={`h-2.5 rounded-full ${occupancyRate > 90 ? "bg-red-500" : "bg-green-500"}`}
                                style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                            ></div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Total de Gaiolas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{groupCages.length}</p>
                        <p className="text-sm text-muted-foreground">Cadastradas</p>
                    </CardContent>
                </Card>
            </div>

            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-foreground">Gaiolas</h2>
                    <Button variant="outline" size="sm" disabled>
                        + Nova Gaiola (Em breve)
                    </Button>
                </div>

                {groupCages.length === 0 ? (
                    <div className="text-center py-12 bg-muted/50 rounded-lg">
                        <p className="text-muted-foreground">Nenhuma gaiola cadastrada neste galpão.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groupCages.map((cage) => (
                            <Card
                                key={cage.id}
                                className="hover:shadow-xl transition-all duration-300 cursor-pointer border-l-4 border-l-green-500 transform hover:-translate-y-1 hover:bg-green-50/30"
                                onClick={() => setLocation(`/production/cages/${cage.id}`)}
                            >
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-green-100 rounded-full text-green-600">
                                                🏗️
                                            </div>
                                            <CardTitle className="text-lg font-bold text-gray-800">{cage.name}</CardTitle>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${cage.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {cage.status === 'active' ? 'Ativa' : 'Inativa'}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3 mt-1">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium uppercase">Ocupação</p>
                                                <p className="text-xl font-bold text-gray-900">
                                                    {formatQuantity(cage.currentQuantity)} <span className="text-sm text-gray-400 font-normal">/ {formatQuantity(cage.capacity)}</span>
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500 font-medium uppercase">Disponível</p>
                                                <p className="text-sm font-bold text-green-600">
                                                    {formatQuantity(Math.max(0, cage.capacity - cage.currentQuantity))}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                                            <div
                                                className={`h-2.5 rounded-full transition-all duration-500 ${(cage.currentQuantity / cage.capacity) >= 0.9 ? "bg-red-500" :
                                                        (cage.currentQuantity / cage.capacity) >= 0.7 ? "bg-amber-500" : "bg-green-500"
                                                    }`}
                                                style={{ width: `${Math.min((cage.currentQuantity / cage.capacity) * 100, 100)}%` }}
                                            ></div>
                                        </div>

                                        <div className="pt-2 border-t border-gray-100 flex justify-end">
                                            <span className="text-xs font-bold text-green-600 flex items-center gap-1 group-hover:underline">
                                                Gerenciar Lotes ➡️
                                            </span>
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
