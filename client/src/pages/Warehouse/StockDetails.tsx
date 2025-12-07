import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Loading from "@/components/ui/Loading";
import { useWarehouse } from "@/hooks/useWarehouse";
import { useGroups } from "@/hooks/useGroups";
import { formatDate } from "@/utils/date";
import { formatQuantity } from "@/utils/format";

export default function StockDetails() {
    const [match, params] = useRoute("/warehouse/:type");
    const type = params?.type as "production" | "fertilized" | "slaughter" | "chicks";

    // Also check location for fallback or direct navigation
    const [location] = useLocation();

    const { inventory, isLoading: isWarehouseLoading } = useWarehouse();
    const { groups, isLoading: isGroupsLoading } = useGroups();

    if (isWarehouseLoading || isGroupsLoading) {
        return <Loading fullScreen message="Carregando detalhes..." />;
    }

    const isRawEggs = type === "production" || location.includes("production");
    const isFertilizedEggs = type === "fertilized" || location.includes("fertilized");
    const isMeat = type === "slaughter" || location.includes("slaughter");
    const isChicks = type === "chicks" || location.includes("chicks");

    // Filter Items based on View
    let displayItems: any[] = [];
    let title = "";
    let description = "";

    if (isRawEggs) {
        title = "Estoque de Ovos Crus (FIFO)";
        description = "Lotes de ovos crus organizados por data de entrada.";
        displayItems = inventory
            .filter(i => i.type === "egg" && i.subtype === "ovo cru" && i.status === "in_stock")
            .sort((a, b) => new Date(a.origin.date).getTime() - new Date(b.origin.date).getTime());
    } else if (isFertilizedEggs) {
        title = "Estoque de Ovos Férteis";
        description = "Lotes de ovos fertilizados de reprodutoras.";
        displayItems = inventory
            .filter(i => i.type === "egg" && i.subtype === "ovos fertilizados" && i.status === "in_stock")
            .sort((a, b) => new Date(a.origin.date).getTime() - new Date(b.origin.date).getTime());
    } else if (isMeat) {
        title = "Estoque de Abatimentos";
        description = "Estoque de aves abatidas e processadas.";
        displayItems = inventory
            .filter(i => i.type === "meat" && i.status === "in_stock");
    } else if (isChicks) {
        title = "Pintos Disponíveis para Venda";
        description = "Lotes de crescimento com mais de 20 dias.";
        const today = new Date();
        displayItems = groups
            .filter((g: any) => {
                if (g.status !== "active" || g.phase !== "crescimento") return false;
                if (!g.birthDate) return false;
                const birthDate = new Date(g.birthDate);
                const ageInDays = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
                return ageInDays >= 20;
            })
            .map((g: any) => ({
                id: g.id,
                type: "chick",
                subtype: g.species,
                quantity: g.quantity,
                origin: { date: g.birthDate, groupId: g.id },
                expirationDate: null // Chicks don't expire in the same way
            }));
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                        <button
                            onClick={() => window.history.back()}
                            className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg transition-colors font-bold text-sm uppercase tracking-wide"
                        >
                            <span>←</span>
                            Voltar
                        </button>
                        {title}
                    </h1>
                    <p className="text-muted-foreground">{description}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayItems.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                        <p className="text-lg font-medium text-muted-foreground">Nenhum item encontrado neste estoque.</p>
                    </div>
                ) : (
                    displayItems.map(item => {
                        // Calculate Days to Expiration (for Eggs/Meat) or Age (for Chicks)
                        const today = new Date();
                        let statusColor = "bg-green-500";
                        let statusText = "OK";
                        let badgeText = "";

                        if (isChicks) {
                            const birthDate = new Date(item.origin.date);
                            const age = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
                            badgeText = `${age} dias`;
                            statusColor = "bg-blue-500";
                        } else {
                            const expirationDate = item.expirationDate ? new Date(item.expirationDate) : null;
                            const daysToExpiration = expirationDate
                                ? Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                                : null;

                            if (daysToExpiration !== null) {
                                badgeText = `${daysToExpiration} dias rest.`;
                                if (daysToExpiration < 3) statusColor = "bg-red-500";
                                else if (daysToExpiration < 10) statusColor = "bg-yellow-500";
                            }
                        }

                        // Get Group Name (if available)
                        const group = groups.find((g: any) => g.id === item.origin.groupId);
                        const groupName = group ? group.name : (item.origin.groupId || "N/A");

                        return (
                            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1">
                                <div className={`h-2 w-full ${statusColor}`} />
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg capitalize">{item.subtype}</CardTitle>
                                        <span className={`text-xs px-2 py-1 rounded-full text-white ${statusColor} font-medium`}>
                                            {badgeText}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="text-3xl font-bold text-foreground">{formatQuantity(item.quantity)}</p>
                                        <p className="text-sm text-muted-foreground">unidades</p>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between border-b pb-1">
                                            <span className="text-muted-foreground">Origem:</span>
                                            <span className="font-medium">{isChicks ? item.subtype : groupName}</span>
                                        </div>
                                        {item.origin.batchId && (
                                            <div className="flex justify-between border-b pb-1">
                                                <span className="text-muted-foreground">Lote ID:</span>
                                                <span className="font-medium text-xs font-mono">{item.origin.batchId.slice(0, 8)}...</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between border-b pb-1">
                                            <span className="text-muted-foreground">{isChicks ? "Nascimento:" : "Entrada:"}</span>
                                            <span>{formatDate(item.origin.date)}</span>
                                        </div>
                                        {!isChicks && (
                                            <div className="flex justify-between pt-1">
                                                <span className="text-muted-foreground">Validade:</span>
                                                <span className="font-bold text-foreground">
                                                    {item.expirationDate ? formatDate(item.expirationDate) : "N/A"}
                                                </span>
                                            </div>
                                        )}

                                        {/* History Section (Only for Inventory Items) */}
                                        {!isChicks && item.history && item.history.length > 0 && (
                                            <div className="mt-4 pt-2 border-t border-border">
                                                <p className="text-xs font-semibold text-muted-foreground mb-2">Histórico:</p>
                                                <div className="space-y-1 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                                                    {item.history.map((hist: any, idx: number) => (
                                                        <div key={idx} className="flex justify-between text-xs py-0.5">
                                                            <span className="text-muted-foreground">{formatDate(hist.date)}</span>
                                                            <span className={hist.action === 'entry' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                                                {hist.action === 'entry' ? '+' : '-'}{formatQuantity(hist.quantity)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
