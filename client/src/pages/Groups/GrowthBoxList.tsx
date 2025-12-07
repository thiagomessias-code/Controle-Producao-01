import { useState } from "react";
import { useLocation } from "wouter";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useBatches } from "@/hooks/useBatches";
import { formatQuantity } from "@/utils/format";
import { getDaysDifference } from "@/utils/date";

export default function GrowthBoxList() {
    const [, setLocation] = useLocation();
    const { batches: groups, isLoading } = useBatches();
    const [showHistory, setShowHistory] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Filter for growth boxes (consider "caricoto" como fase de crescimento para mock/teste)
    const growthBoxes = (groups || []).filter((g) => {
        // Must be growth phase
        if (g.phase !== "crescimento" && g.phase !== "caricoto") return false;

        // Search filter
        if (searchTerm && !g.name.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }

        // History filter
        if (showHistory) {
            return g.status === "inactive" || g.status === "sold";
        }
        return g.status === "active";
    });

    if (isLoading) {
        return <div className="p-8 text-center">Carregando caixas...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">
                        {showHistory ? "Histórico de Caixas 📦" : "Caixas de Crescimento 📦"}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {showHistory
                            ? "Visualize caixas finalizadas"
                            : "Gerencie seus lotes em fase de crescimento (0-35 dias)"}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setShowHistory(!showHistory)}
                    >
                        {showHistory ? "Ver Ativas" : "Ver Histórico / Inativas"}
                    </Button>
                    <Button variant="outline" onClick={() => setLocation("/groups")}>
                        Ver Galpões
                    </Button>
                </div>
            </div>

            <div className="relative">
                <input
                    type="text"
                    placeholder="Buscar caixa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 pl-10 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="absolute left-3 top-2.5 text-muted-foreground">🔍</span>
            </div>

            {growthBoxes.length === 0 ? (
                <div className="text-center py-12 bg-muted/50 rounded-lg">
                    <p className="text-xl font-semibold text-foreground mb-2">
                        {showHistory ? "Nenhuma caixa no histórico" : "Nenhuma caixa ativa encontrada"}
                    </p>
                    <p className="text-muted-foreground">
                        {showHistory
                            ? "As caixas transferidas para gaiolas aparecerão aqui."
                            : "Transfira lotes da incubação para vê-los aqui."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {growthBoxes.map((box) => {
                        const age = box.birthDate
                            ? getDaysDifference(new Date(box.birthDate), new Date())
                            : 0;
                        const daysLeft = 35 - age;

                        return (
                            <Card
                                key={box.id}
                                className={`hover:shadow-lg transition-shadow cursor-pointer border-l-4 ${box.status === 'inactive'
                                    ? 'border-l-gray-400 opacity-75 bg-gray-50'
                                    : 'border-l-blue-500'
                                    }`}
                                onClick={() => setLocation(`/batches/${box.id}`)}
                            >
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg">{box.name}</CardTitle>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${box.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-800'
                                            }`}>
                                            {box.status === 'active' ? `${age} dias` : 'Finalizada'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{box.species}</p>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Quantidade:</span>
                                            <span className="font-semibold text-primary">
                                                {formatQuantity(box.quantity)}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Fase:</span>
                                            <span className="text-sm font-medium">Crescimento</span>
                                        </div>

                                        {box.status === 'active' && (
                                            <div className="pt-2 border-t border-border space-y-2">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-muted-foreground">Transferência em:</span>
                                                    <span className={`font-bold ${daysLeft <= 0 ? "text-green-600" : "text-amber-600"}`}>
                                                        {daysLeft <= 0 ? "Pronto!" : `${daysLeft} dias`}
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    className="w-full mt-2"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setLocation(`/batches/${box.id}`);
                                                    }}
                                                >
                                                    Gerenciar / Transferir
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
