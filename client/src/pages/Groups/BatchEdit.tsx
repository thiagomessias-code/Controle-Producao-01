import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Loading from "@/components/ui/Loading";
import { useBatchById, useBatches } from "@/hooks/useBatches";

export default function GroupEdit() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/batches/:id/edit");
  const groupId = params?.id || "";

  const { batch: group, isLoading: groupLoading } = useBatchById(groupId);
  const { update, isUpdating } = useBatches();

  const [formData, setFormData] = useState({
    name: "",
    species: "",
    quantity: "",
    birthDate: "",
    location: "",
    status: "active" as "active" | "inactive" | "sold",
    notes: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name,
        species: group.species,
        quantity: group.quantity.toString(),
        birthDate: group.birthDate,
        location: group.location,
        status: group.status,
        notes: group.notes || "",
      });
    }
  }, [group]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.species || !formData.quantity || !formData.birthDate || !formData.location) {
      setError("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    try {
      update({
        id: groupId,
        data: {
          name: formData.name,
          species: formData.species,
          quantity: parseInt(formData.quantity),
          birthDate: formData.birthDate,
          location: formData.location,
          status: formData.status,
          notes: formData.notes,
        },
      });
      setLocation(`/batches/${groupId}`);
    } catch (err) {
      setError("Erro ao atualizar grupo");
    }
  };

  if (groupLoading) {
    return <Loading fullScreen message="Carregando grupo..." />;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Editar Grupo</h1>
        <p className="text-muted-foreground mt-1">
          Atualize as informações do grupo
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Grupo</CardTitle>
          <CardDescription>
            Modifique os dados do grupo de aves
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
                label="Nome do Grupo"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={isUpdating}
              />

              <Input
                label="Espécie"
                name="species"
                value={formData.species}
                onChange={handleChange}
                disabled={isUpdating}
              />

              <Input
                label="Quantidade"
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                disabled={isUpdating}
              />

              <Input
                label="Data de Nascimento"
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                disabled={isUpdating}
              />

              <Input
                label="Localização"
                name="location"
                value={formData.location}
                onChange={handleChange}
                disabled={isUpdating}
              />

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={isUpdating}
                  className="w-full px-4 py-2 rounded-lg border-2 border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="sold">Vendido</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Notas
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                disabled={isUpdating}
                className="w-full px-4 py-2 rounded-lg border-2 border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
                rows={4}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                isLoading={isUpdating}
              >
                Salvar Alterações
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setLocation(`/batches/${groupId}`)}
                disabled={isUpdating}
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
