import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Loading from "@/components/ui/Loading";
import { aviariesApi, Aviary } from "@/api/aviaries";
import { formatQuantity } from "@/utils/format";

export default function AviaryList() {
    const [, setLocation] = useLocation();
    const [aviaries, setAviaries] = useState<Aviary[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadAviaries = async () => {
            try {
                const data = await aviariesApi.getAll();
                setAviaries(data);
            } catch (error) {
                console.error("Failed to load aviaries", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadAviaries();
    }, []);

    if (isLoading) {
        return <Loading fullScreen message="Carregando aviários..." />;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Aviários</h1>
                    <p className="text-muted-foreground mt-1">
                        Gerencie seus aviários e setores de produção.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {aviaries.map((aviary) => (
                    <Card
                        key={aviary.id}
                        className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-600"
                        onClick={() => setLocation(`/aviaries/${aviary.id}`)}
                    >
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-xl">{aviary.name}</CardTitle>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${aviary.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {aviary.status === 'active' ? 'Ativo' : 'Inativo'}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{aviary.location}</p>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Capacidade Total:</span>
                                    <span className="font-semibold text-primary">
                                        {formatQuantity(aviary.capacity)} aves
                                    </span>
                                </div>
                                <div className="pt-2 border-t border-border">
                                    <p className="text-xs text-center text-blue-600 font-medium">
                                        Clique para ver os grupos (Produtoras, Machos...)
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
