import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import QRCodeScanner from "@/components/ui/QRCodeScanner";
import { useProduction } from "@/hooks/useProduction";
import { useWarehouse } from "@/hooks/useWarehouse";
import { useCages } from "@/hooks/useCages";
import { useBatches } from "@/hooks/useBatches";
import { FIXED_GROUPS } from "@/constants/groups";

export default function RegisterProduction() {
  const [, setLocation] = useLocation();
  const { create, isCreating } = useProduction();
  const { addInventory } = useWarehouse();
  const { cages } = useCages();
  const { batches } = useBatches();
  const [showScanner, setShowScanner] = useState(true);

  const [formData, setFormData] = useState({
    groupId: "",
    cageId: "",
    date: new Date().toISOString().split("T")[0],
    eggType: "fertile",
    quantity: "",
    quality: "A" as "A" | "B" | "C",
    notes: "",
  });
  const [error, setError] = useState("");

  // Auto-detect batch when cage is selected
  const [detectedBatch, setDetectedBatch] = useState<any>(null);

  useEffect(() => {
    if (formData.cageId) {
      const batch = batches?.find((b: any) =>
        b.cageId === formData.cageId && b.status === 'active'
      );
      setDetectedBatch(batch || null);
    } else {
      setDetectedBatch(null);
    }
  }, [formData.cageId, batches]);

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
        cageId: scannedData.cageId || prev.cageId,
      }));
      setShowScanner(false);
    } catch {
      setError("QR Code inválido");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.groupId || !formData.cageId || !formData.date || !formData.quantity || !formData.eggType) {
      setError("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    if (!detectedBatch) {
      setError("Nenhum lote ativo encontrado nesta gaiola");
      return;
    }

    try {
      const qty = parseInt(formData.quantity);

      // Create production record
      await create({
        groupId: formData.groupId,
        cageId: formData.cageId,
        date: formData.date,
        eggType: formData.eggType,
        quantity: qty,
        quality: formData.quality,
        notes: formData.notes,
      });

      // Add to warehouse
      await addInventory({
        type: "egg",
        subtype: formData.eggType === "fertile" ? "ovo fértil" : "ovo cru",
        quantity: qty,
        origin: {
          groupId: formData.groupId,
          batchId: detectedBatch.id,
          date: formData.date
        }
      });

      alert("Produção registrada com sucesso!");
      setLocation("/production");
    } catch (err) {
      setError("Erro ao registrar produção");
    }
  };

  // Filter cages by selected group
  const filteredCages = formData.groupId
    ? cages?.filter((c: any) => c.groupId === formData.groupId && c.status === 'active')
    : [];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Registrar Produção</h1>
        <p className="text-muted-foreground mt-1">
          Registre a produção de ovos
        </p>
      </div>

      {showScanner && (
        <QRCodeScanner
          onScan={handleQRCodeScan}
          onClose={() => setShowScanner(false)}
          title="Escanear QR Code da Gaiola"
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Nova Produção</CardTitle>
          <CardDescription>
            Selecione o grupo e a gaiola
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
                  {FIXED_GROUPS.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
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
                label="Quantidade *"
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="0"
                disabled={isCreating}
              />

              <Input
                label="Peso (g)"
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                placeholder="0"
                disabled={isCreating}
              />

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Destino dos ovos *
                </label>
                <select
                  name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  disabled={isCreating}
                  className="w-full px-4 py-2 rounded-lg border-2 border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
                >
                  <option value="">Selecione o destino</option>
                  <option value="Venda">Venda</option>
                  <option value="Consumo interno">Consumo interno</option>
                  <option value="Incubação">Incubação (ovos galados)</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Qualidade
                </label>
                <select
                  name="quality"
                  value={formData.quality}
                  onChange={handleChange}
                  disabled={isCreating}
                  className="w-full px-4 py-2 rounded-lg border-2 border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
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
                Registrar Produção
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setLocation("/production")}
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
