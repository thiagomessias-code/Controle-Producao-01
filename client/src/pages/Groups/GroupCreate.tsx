import { useState } from "react";
import { useLocation } from "wouter";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { useGroups } from "@/hooks/useGroups";

export default function GroupCreate() {
    const [, setLocation] = useLocation();
    const { create, isCreating } = useGroups();

    // Get aviaryId from query params
    const searchParams = new URLSearchParams(window.location.search);
    const aviaryIdParam = searchParams.get('aviaryId');

    const [formData, setFormData] = useState({
        name: "",
        type: "production",
        capacity: "",
        description: "",
        aviaryId: aviaryIdParam || "", // Pre-fill
    });
    const [error, setError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.capacity) {
            setError("Por favor, preencha todos os campos obrigatórios");
            return;
        }

        try {
            await create({
                name: formData.name,
                type: formData.type as "production" | "males" | "breeders", // Ensure valid type
                capacity: parseInt(formData.capacity),
                location: formData.description, // Mapping description to location/notes if needed or custom field
                // Note: api/groups expects 'location'. Let's use description as location for now or empty.
                species: "chicken", // Default
                aviaryId: formData.aviaryId,
            });
            // Redirect back to aviary if available
            if (formData.aviaryId) {
                setLocation(`/aviaries/${formData.aviaryId}`);
            } else {
                setLocation("/groups");
            }
        } catch (err) {
            setError("Erro ao criar galpão/grupo");
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-foreground">Criar Novo Galpão/Grupo</h1>
                <p className="text-muted-foreground mt-1">
                    Adicione um novo galpão ou setor de produção
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Informações do Galpão</CardTitle>
                    <CardDescription>
                        Preencha os dados do novo galpão
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Nome do Galpão"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Ex: Galpão A"
                                disabled={isCreating}
                            />

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Tipo
                                </label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    disabled={isCreating}
                                    className="w-full px-4 py-2 rounded-lg border-2 border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
                                >
                                    <option value="production">Galinhas Poedeiras (Postura)</option>
                                    <option value="males">Machos (Reprodução)</option>
                                    <option value="breeders">Matrizes (Reprodutoras)</option>
                                    <option value="chicks">Pintos (Crescimento)</option>
                                </select>
                            </div>

                            <Input
                                label="Capacidade Total (Aves)"
                                type="number"
                                name="capacity"
                                value={formData.capacity}
                                onChange={handleChange}
                                placeholder="0"
                                disabled={isCreating}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Descrição
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Adicione uma descrição..."
                                disabled={isCreating}
                                className="w-full px-4 py-2 rounded-lg border-2 border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
                                rows={4}
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="submit"
                                variant="primary"
                                className="flex-1"
                                isLoading={isCreating}
                            >
                                Criar Galpão
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => setLocation("/groups")}
                                disabled={isCreating}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
