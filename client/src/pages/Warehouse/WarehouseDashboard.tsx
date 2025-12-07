import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Loading from "@/components/ui/Loading";
import { useWarehouse } from "@/hooks/useWarehouse";
import { useGroups } from "@/hooks/useGroups";
import { formatQuantity } from "@/utils/format";

export default function WarehouseDashboard() {
    const [, setLocation] = useLocation();
    const { inventory, isLoading: isWarehouseLoading } = useWarehouse();
    const { groups, isLoading: isGroupsLoading } = useGroups();

    if (isWarehouseLoading || isGroupsLoading) {
        return <Loading fullScreen message="Carregando armazém..." />;
    }

    // Calculate Totals
    const totalRawEggs = inventory
        .filter(i => i.type === "egg" && i.subtype === "ovo cru" && i.status === "in_stock")
        .reduce((acc, i) => acc + i.quantity, 0);

    const totalFertilizedEggs = inventory
        .filter(i => i.type === "egg" && i.subtype === "ovos fertilizados" && i.status === "in_stock")
        .reduce((acc, i) => acc + i.quantity, 0);

    const totalMeat = inventory
        .filter(i => i.type === "meat" && i.status === "in_stock")
        .reduce((acc, i) => acc + i.quantity, 0);

    // Calculate Chicks (From Inventory)
    const chicksAvailable = inventory
        .filter(i => i.type === "chick" && i.status === "in_stock")
        .reduce((acc, i) => acc + i.quantity, 0);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Armazém Central 🏭 (v2.0)</h1>
                    <p className="text-muted-foreground">Gestão de estoque de produção e abatimentos</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Bloco Ovos Crus */}
                <Card
                    className="cursor-pointer hover:shadow-xl transition-all border-l-8 border-l-yellow-400"
                    onClick={() => setLocation("/warehouse/production")}
                >
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            🥚 Ovos Crus
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-yellow-50 p-4 rounded-lg text-center">
                            <span className="text-3xl">🥚</span>
                            <p className="text-sm text-yellow-800 font-medium mt-2">Estoque</p>
                            <p className="text-3xl font-bold text-yellow-900">{formatQuantity(totalRawEggs)}</p>
                        </div>
                        <p className="text-center text-xs text-blue-600 font-medium">Ver detalhes →</p>
                    </CardContent>
                </Card>

                {/* Bloco Ovos Fertilizados */}
                <Card
                    className="cursor-pointer hover:shadow-xl transition-all border-l-8 border-l-purple-500"
                    onClick={() => setLocation("/warehouse/fertilized")}
                >
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            🧬 Ovos Férteis
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-purple-50 p-4 rounded-lg text-center">
                            <span className="text-3xl">🧬</span>
                            <p className="text-sm text-purple-800 font-medium mt-2">Estoque</p>
                            <p className="text-3xl font-bold text-purple-900">{formatQuantity(totalFertilizedEggs)}</p>
                        </div>
                        <p className="text-center text-xs text-blue-600 font-medium">Ver detalhes →</p>
                    </CardContent>
                </Card>

                {/* Bloco Abatimentos (Carne) */}
                <Card
                    className="cursor-pointer hover:shadow-xl transition-all border-l-8 border-l-red-500"
                    onClick={() => setLocation("/warehouse/slaughter")}
                >
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            🍖 Abatimentos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-red-50 p-4 rounded-lg text-center">
                            <span className="text-3xl">🍗</span>
                            <p className="text-sm text-red-800 font-medium mt-2">Estoque</p>
                            <p className="text-3xl font-bold text-red-900">{formatQuantity(totalMeat)}</p>
                        </div>
                        <p className="text-center text-xs text-red-600 font-medium">Ver detalhes →</p>
                    </CardContent>
                </Card>

                {/* Bloco Pintos (Venda) */}
                <Card
                    className="cursor-pointer hover:shadow-xl transition-all border-l-8 border-l-blue-500"
                    onClick={() => setLocation("/warehouse/chicks")}
                >
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            🐥 Pintos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                            <span className="text-3xl">🐥</span>
                            <p className="text-sm text-blue-800 font-medium mt-2">Venda</p>
                            <p className="text-3xl font-bold text-blue-900">{formatQuantity(chicksAvailable)}</p>
                        </div>
                        <p className="text-center text-xs text-blue-600 font-medium">Ver detalhes →</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
