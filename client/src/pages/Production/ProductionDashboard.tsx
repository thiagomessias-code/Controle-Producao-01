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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Produção (Postura)</h1>
                    <p className="text-muted-foreground mt-1">
                        Gerenciamento de gaiolas e lotes de produção.
                    </p>
                </div>
                <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                    + Nova Gaiola
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-blue-800 text-lg">Total de Gaiolas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-blue-900">{cages.length}</p>
                    </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-green-800 text-lg">Capacidade Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-green-900">
                            {cages.reduce((acc, cage) => acc + cage.capacity, 0)}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-amber-800 text-lg">Aves em Produção</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-amber-900">
                            {cages.reduce((acc, cage) => acc + cage.currentQuantity, 0)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <CageList cages={cages} />

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md mx-4">
                        <CardHeader>
                            <CardTitle>Nova Gaiola</CardTitle>
                            <CardDescription>
                                Cadastre uma nova gaiola para o setor de produção.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreateCage} className="space-y-4">
                                <Input
                                    label="Nome / Identificação"
                                    placeholder="Ex: Gaiola A1"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Capacidade Máxima"
                                    type="number"
                                    placeholder="Ex: 50"
                                    value={formData.capacity}
                                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                    required
                                />
                                <div className="flex gap-3 pt-4 border-t">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="flex-1"
                                        isLoading={isCreating}
                                    >
                                        Criar Gaiola
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setIsModalOpen(false)}
                                    >
                                        Cancelar
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
