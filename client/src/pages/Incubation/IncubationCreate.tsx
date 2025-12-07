import { useState } from "react";
import { useLocation } from "wouter";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { useIncubation } from "@/hooks/useIncubation";

export default function IncubationCreate() {
  const [, setLocation] = useLocation();
  const { create, isCreating } = useIncubation();

  const generateBatchNumber = () => {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:T.]/g, "").slice(0, 12); // YYYYMMDDHHMM
    return `LOTE-${timestamp}`;
  };

  // Incubation periods in days
  const INCUBATION_PERIODS: Record<string, number> = {
    "Codornas Japonesas": 17,
    "Codornas Gigantes": 17,
    "Codornas Chinesas": 16,
  };

  const calculateHatchDate = (start: string, species: string) => {
    if (!start) return "";
    const date = new Date(start);
    const days = INCUBATION_PERIODS[species] || 17; // Default to 17
    date.setDate(date.getDate() + days);
    return date.toISOString().split("T")[0];
  };

  const [formData, setFormData] = useState({
    batchNumber: generateBatchNumber(),
    eggQuantity: "",
    startDate: new Date().toISOString().split("T")[0],
    expectedHatchDate: calculateHatchDate(new Date().toISOString().split("T")[0], "Codornas Japonesas"),
    species: "Codornas Japonesas",
    temperature: "37.5",
    humidity: "75",
    notes: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const newData = { ...prev, [name]: value };

      // Auto-calculate hatch date if start date or species changes
      if (name === "startDate" || name === "species") {
        newData.expectedHatchDate = calculateHatchDate(newData.startDate, newData.species);
      }

      return newData;
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.batchNumber || !formData.eggQuantity || !formData.expectedHatchDate) {
      setError("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    try {
      create({
        batchNumber: formData.batchNumber,
        eggQuantity: parseInt(formData.eggQuantity),
        species: formData.species,
        startDate: formData.startDate,
        expectedHatchDate: formData.expectedHatchDate,
        temperature: parseFloat(formData.temperature),
        humidity: parseFloat(formData.humidity),
        notes: formData.notes,
        status: "incubating",
        history: [
          {
            date: new Date().toISOString(),
            event: "Lote Criado",
            quantity: parseInt(formData.eggQuantity),
            details: `Início da incubação com ${formData.eggQuantity} ovos.`,
          }
        ]
      });
      setLocation("/incubation");
    } catch (err) {
      setError("Erro ao criar lote de incubação");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Novo Lote de Incubação</h1>
        <p className="text-muted-foreground mt-1">
          Crie um novo lote para incubar ovos
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Lote</CardTitle>
          <CardDescription>
            Preencha os dados do novo lote de incubação
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
                label="Número do Lote (Automático)"
                name="batchNumber"
                value={formData.batchNumber}
                onChange={handleChange}
                placeholder="Gerado automaticamente..."
                disabled={true}
                className="bg-muted"
              />

              <Input
                label="Quantidade de Ovos"
                type="number"
                name="eggQuantity"
                value={formData.eggQuantity}
                onChange={handleChange}
                placeholder="0"
                disabled={isCreating}
              />

              <Input
                label="Data de Início"
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                disabled={isCreating}
              />

              <Input
                label="Data Esperada de Eclosão"
                type="date"
                name="expectedHatchDate"
                value={formData.expectedHatchDate}
                onChange={handleChange}
                disabled={isCreating}
              />

              <Input
                label="Temperatura (°C)"
                type="number"
                step="0.1"
                name="temperature"
                value={formData.temperature}
                onChange={handleChange}
                disabled={isCreating}
              />

              <Input
                label="Umidade (%)"
                type="number"
                name="humidity"
                value={formData.humidity}
                onChange={handleChange}
                disabled={isCreating}
              />

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Espécie
                </label>
                <select
                  name="species"
                  value={formData.species}
                  onChange={handleChange as any}
                  disabled={isCreating}
                  className="w-full px-4 py-2 rounded-lg border-2 border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
                >
                  <option value="">Selecione a espécie</option>
                  <option value="Codornas Japonesas">Codornas Japonesas</option>
                  <option value="Codornas Gigantes">Codornas Gigantes</option>
                  <option value="Codornas Chinesas">Codornas Chinesas</option>
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
                placeholder="Adicione observações sobre o lote..."
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
                Criar Lote
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setLocation("/incubation")}
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
