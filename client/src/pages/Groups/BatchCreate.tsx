import { useState } from "react";
import { useLocation } from "wouter";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { useBatches } from "@/hooks/useBatches";

export default function BatchCreate() {
  const [, setLocation] = useLocation();
  const { create, isCreating } = useBatches();
  const [formData, setFormData] = useState({
    name: "",
    species: "",
    quantity: "",
    birthDate: "",
    location: "",
    phase: "caricoto",
    notes: "",
  });
  const [error, setError] = useState("");
  const [showQRCode, setShowQRCode] = useState(false);
  const [newGroupId, setNewGroupId] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      const groupId = `group_${Date.now()}`;
      create({
        name: formData.name,
        species: formData.species,
        quantity: parseInt(formData.quantity),
        birthDate: formData.birthDate,
        location: formData.location,
        phase: formData.phase as any,
        notes: formData.notes,
      });
      setNewGroupId(groupId);
      setShowQRCode(true);
    } catch (err) {
      setError("Erro ao criar grupo");
    }
  };

  if (showQRCode && newGroupId) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Grupo Criado com Sucesso! 🎉</h1>
          <p className="text-muted-foreground mt-1">
            Seu novo grupo foi criado. Aqui está o QR Code para rastreamento
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>QR Code do Grupo</CardTitle>
            <CardDescription>
              {formData.name} - {formData.species}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <div className="bg-white p-6 rounded-lg border-2 border-primary">
                <svg
                  width="200"
                  height="200"
                  viewBox="0 0 200 200"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="200" height="200" fill="white" />
                  <rect x="10" y="10" width="50" height="50" fill="black" />
                  <rect x="15" y="15" width="40" height="40" fill="white" />
                  <rect x="20" y="20" width="30" height="30" fill="black" />
                  <rect x="140" y="10" width="50" height="50" fill="black" />
                  <rect x="145" y="15" width="40" height="40" fill="white" />
                  <rect x="150" y="20" width="30" height="30" fill="black" />
                  <rect x="10" y="140" width="50" height="50" fill="black" />
                  <rect x="15" y="145" width="40" height="40" fill="white" />
                  <rect x="20" y="150" width="30" height="30" fill="black" />
                </svg>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Informações do Grupo</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li><strong>Nome:</strong> {formData.name}</li>
                <li><strong>Espécie:</strong> {formData.species}</li>
                <li><strong>Quantidade:</strong> {formData.quantity}</li>
                <li><strong>Localização:</strong> {formData.location}</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => setLocation(`/groups/${newGroupId}`)}
              >
                Ver Grupo
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setLocation("/groups")}
              >
                Voltar para Grupos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Criar Novo Grupo</h1>
        <p className="text-muted-foreground mt-1">
          Adicione um novo grupo de aves ao seu sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Grupo</CardTitle>
          <CardDescription>
            Preencha os dados do novo grupo de aves
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
                placeholder="Ex: Grupo A"
                disabled={isCreating}
              />

              <Input
                label="Espécie"
                name="species"
                value={formData.species}
                onChange={handleChange}
                placeholder="Ex: Galinha, Codorna"
                disabled={isCreating}
              />

              <Input
                label="Quantidade"
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="0"
                disabled={isCreating}
              />

              <Input
                label="Data de Nascimento"
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                disabled={isCreating}
              />

              <Input
                label="Localização"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Ex: Galpão 1"
                disabled={isCreating}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Fase
                </label>
                <select
                  name="phase"
                  value={formData.phase}
                  onChange={handleChange as any}
                  disabled={isCreating}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="incubation">Incubação</option>
                  <option value="caricoto">Caricoto</option>
                  <option value="growth">Crescimento</option>
                  <option value="fattening">Engorda</option>
                  <option value="laying">Postura</option>
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
                placeholder="Adicione observações sobre o grupo..."
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
                Criar Grupo
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
