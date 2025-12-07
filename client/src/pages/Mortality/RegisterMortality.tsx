import { useState } from "react";
import { useLocation } from "wouter";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { useMortality } from "@/hooks/useMortality";
import { useGroups } from "@/hooks/useGroups";
import { useWarehouse } from "@/hooks/useWarehouse";
import { useCages } from "@/hooks/useCages";
import QRCodeScanner from "@/components/ui/QRCodeScanner";

export default function RegisterMortality() {
  const [, setLocation] = useLocation();
  const { groups, update: updateGroup } = useGroups();
  const { create, isCreating } = useMortality();

  const { addInventory } = useWarehouse();
  const { cages } = useCages();
  const [showScanner, setShowScanner] = useState(true);

  const [formData, setFormData] = useState({
    groupId: "",
    cageId: "",
    date: new Date().toISOString().split("T")[0],
    quantity: "",
    cause: "Doença", // Default
    notes: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleQRCodeScan = (data: string) => {
    try {
      const scannedData = JSON.parse(data);
      setFormData((prev) => ({
        ...prev,
        groupId: scannedData.groupId || prev.groupId,
        cageId: scannedData.cageId || prev.cageId,
      }));
      setShowScanner(false);
    } catch {
      setError("QR Code inválido");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.groupId || !formData.date || !formData.quantity || !formData.cause) {
      setError("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    const qty = parseInt(formData.quantity);
    const selectedGroup = groups.find((g: any) => g.id === formData.groupId);

    if (!selectedGroup) {
      setError("Grupo não encontrado");
      return;
    }

    try {
      // 1. Create Mortality/Slaughter Record
      await create({
        groupId: formData.groupId,
        cageId: formData.cageId,
        date: formData.date,
        quantity: qty,
        cause: formData.cause,
        notes: formData.notes,
      });

      // 2. Update Group Quantity and History
      const newHistory = [
        ...(selectedGroup.history || []),
        {
          date: new Date().toISOString(),
          event: formData.cause === "Abate" ? "Abate" : "Mortalidade",
          quantity: qty,
          details: `Causa: ${formData.cause}. ${formData.notes || ""}`
        }
      ];

      // 3. If Slaughter (Abate), add to Warehouse
      if (formData.cause === "Abate") {
        await addInventory({
          type: "meat",
          subtype: "codorna abatida",
          quantity: qty,
          origin: {
            groupId: formData.groupId,
            batchId: selectedGroup.batchId, // Traceability
            date: formData.date
          }
        });
      }

      await updateGroup({
        id: formData.groupId,
        data: {
          quantity: selectedGroup.quantity - qty,
          history: newHistory
        }
      });

      alert(`Registro de ${formData.cause} realizado com sucesso!`);
      setLocation("/mortality");
    } catch (err) {
      setError("Erro ao registrar abatimento/mortalidade");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Registrar Abatimentos</h1>
        <p className="text-muted-foreground mt-1">
          Registre óbitos ou abates para o armazém
        </p>
      </div>

      {showScanner && (
        <QRCodeScanner
          onScan={handleQRCodeScan}
          onClose={() => setShowScanner(false)}
          title="Escanear QR Code"
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Novo Registro</CardTitle>
          <CardDescription>
            Preencha os dados do abatimento ou mortalidade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Grupo *
              </label>
              <div className="flex gap-2">
                <select
                  name="groupId"
                  value={formData.groupId}
                  onChange={handleChange}
                  disabled={isCreating}
                  className="flex-1 px-4 py-2 rounded-lg border-2 border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
                >
                  <option value="">Selecione um grupo</option>
                  {groups
                    .filter((group: any) => group.status === "active")
                    .map((group: any) => (
                      <option key={group.id} value={group.id}>
                        {group.name} - {group.location} ({group.species})
                      </option>
                    ))}
                </select>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowScanner(true)}
                  disabled={isCreating}
                >
                  📱 QR
                </Button>
              </div>
            </div>

            {/* Cage Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Gaiola *
              </label>
              <select
                name="cageId"
                value={formData.cageId}
                onChange={handleChange}
                disabled={isCreating || !formData.groupId}
                required
                className="w-full px-4 py-2 rounded-lg border-2 border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
              >
                <option value="">Selecione uma gaiola</option>
                {cages
                  .filter(c => c.groupId === formData.groupId && c.status === 'active')
                  .map((cage: any) => (
                    <option key={cage.id} value={cage.id}>
                      {cage.name} ({cage.currentQuantity}/{cage.capacity})
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Data"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
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
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Causa / Motivo *
              </label>
              <select
                name="cause"
                value={formData.cause}
                onChange={handleChange}
                disabled={isCreating}
                className="w-full px-4 py-2 rounded-lg border-2 border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
              >
                <option value="Doença">Doença (Apenas Histórico)</option>
                <option value="Consumo Interno">Consumo Interno (Apenas Histórico)</option>
                <option value="Abate">Abate (Enviar para Armazém)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Notas
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Adicione observações..."
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
                Registrar
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setLocation("/mortality")}
                disabled={isCreating}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div >
  );
}
