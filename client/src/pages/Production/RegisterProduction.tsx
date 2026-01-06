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
import { useGroups } from "@/hooks/useGroups";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function RegisterProduction() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { groups } = useGroups();
  const { create, isCreating } = useProduction();
  const { addInventory } = useWarehouse();
  const { cages } = useCages();
  const { batches } = useBatches();
  const [showScanner, setShowScanner] = useState(true);

  const [formData, setFormData] = useState({
    groupId: "",
    cageId: "",
    date: new Date().toISOString().split("T")[0],
    eggType: "table" as "fertile" | "table", // Default to table
    quantity: "",
    quality: "A" as "A" | "B" | "C",
    isInternalConsumption: false,
    notes: "",
  });
  const [error, setError] = useState("");

  // Auto-detect batch when cage is selected

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

  // Logic: "se o ovo vem do grupo reprodutora ele sempre sera fertil"
  useEffect(() => {
    if (formData.groupId) {
      const selectedGroup = groups?.find(g => g.id === formData.groupId);
      if (selectedGroup?.type === 'breeders') {
        setFormData(prev => ({ ...prev, eggType: 'fertile' }));
      }
    }
  }, [formData.groupId, groups]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleQRCodeScan = (data: string) => {
    const rawData = data.trim();
    try {
      let cageId = "";
      let groupId = "";

      if (rawData.startsWith("GAIOLA:")) {
        cageId = rawData.replace("GAIOLA:", "");
        const cage = cages.find(c => String(c.id) === String(cageId));
        if (cage) {
          groupId = cage.groupId;
        }
      } else {
        try {
          const scannedData = JSON.parse(rawData);
          groupId = scannedData.groupId || "";
          cageId = scannedData.cageId || "";
        } catch (e) {
          // Fallback to raw ID lookup
          const cage = cages.find(c => String(c.id) === String(rawData));
          if (cage) {
            cageId = rawData;
            groupId = cage.groupId;
          }
        }
      }

      if (groupId || cageId) {
        setFormData((prev) => ({
          ...prev,
          groupId: groupId || prev.groupId,
          cageId: cageId || prev.cageId,
        }));
        setShowScanner(false);
        setError(""); // Clear any previous errors on success
      } else {
        setError("QR Code não reconhecido");
      }
    } catch (e) {
      setError("Erro ao processar QR Code");
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

      if (qty > (detectedBatch?.quantity || 0)) {
        setError(`Quantidade não pode ser superior ao número de aves no lote (${detectedBatch?.quantity || 0})`);
        return;
      }

      // Use current time if date is today
      const finalDate = formData.date === new Date().toISOString().split('T')[0]
        ? new Date().toISOString()
        : formData.date;

      console.log("Registrando produção...");
      // Create production record
      await create({
        groupId: formData.groupId,
        cageId: formData.cageId,
        batchId: detectedBatch.id, // Traceability update
        date: finalDate,
        eggType: formData.eggType,
        quantity: qty,
        quality: formData.quality,
        destination: formData.isInternalConsumption ? "Consumo" : "Venda",
        notes: formData.notes,
        userId: user?.id,
      });

      // Validity calc for inventory
      const expirationDate = new Date(finalDate);
      expirationDate.setDate(expirationDate.getDate() + 30);

      // Add to warehouse (if NOT for internal consumption)
      if (!formData.isInternalConsumption) {
        try {
          await addInventory({
            type: "egg",
            subtype: formData.eggType === "fertile" ? "ovo fértil" : "ovo cru",
            quantity: qty,
            origin: {
              groupId: formData.groupId,
              batchId: detectedBatch.id,
              cageId: formData.cageId,
              date: finalDate
            },
            expirationDate: expirationDate.toISOString().split('T')[0]
          });
          console.log("Adicionado ao estoque com sucesso.");
        } catch (stockErr) {
          console.error("Erro ao adicionar ao estoque:", stockErr);
          toast.error("Produção registrada, mas houve um erro ao atualizar o estoque. Verifique os logs.");
        }
      } else {
        console.log("Destino é Consumo Interno. Pulando atualização de estoque.");
      }

      toast.success("Produção registrada com sucesso!");
      setLocation("/production");
    } catch (err) {
      console.error(err);
      setError("Erro ao registrar produção");
    }
  };





  const handleCageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cageId = e.target.value;
    setFormData(prev => ({ ...prev, cageId }));
  };

  // ... (rest of handleSubmit, etc.)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => window.history.back()}>
            ⬅️ Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Registrar Produção</h1>
            <p className="text-muted-foreground mt-1">
              Registre a produção de ovos
            </p>
          </div>
        </div>
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
            Selecione o tipo de grupo e a gaiola
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
                Grupo (Galpão) *
              </label>
              <div className="flex gap-2">
                <select
                  name="groupId"
                  value={formData.groupId}
                  onChange={(e) => {
                    const newGroupId = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      groupId: newGroupId,
                      cageId: "" // Reset cage when group changes
                    }));
                  }}
                  disabled={isCreating}
                  className="flex-1 px-4 py-2 rounded-lg border-2 border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
                >
                  <option value="">Selecione um grupo...</option>
                  {groups?.filter((g: any) => g.type !== 'machos').map((group: any) => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({group.type})
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
                onChange={handleCageChange}
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

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tipo de Ovo *
                </label>
                <select
                  name="eggType"
                  value={formData.eggType}
                  onChange={handleChange}
                  disabled={isCreating}
                  className="w-full px-4 py-2 rounded-lg border-2 border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
                >
                  <option value="fertile">Ovo Fértil</option>
                  <option value="table">Ovo de Mesa (Comercial)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Qualidade da Casca
                </label>
                <select
                  name="quality"
                  value={formData.quality}
                  onChange={handleChange}
                  disabled={isCreating}
                  className="w-full px-4 py-2 rounded-lg border-2 border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
                >
                  <option value="A">A (Perfeita)</option>
                  <option value="B">B (Pequenos defeitos)</option>
                  <option value="C">C (Trincados/Sujos)</option>
                </select>
              </div>
              <div className="flex items-center gap-2 h-full pt-8">
                <input
                  type="checkbox"
                  id="isInternalConsumption"
                  name="isInternalConsumption"
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={formData.isInternalConsumption}
                  onChange={(e) => setFormData(prev => ({ ...prev, isInternalConsumption: e.target.checked }))}
                />
                <label htmlFor="isInternalConsumption" className="text-sm font-medium text-foreground">
                  📦 Consumo Interno (Não envia para o estoque)
                </label>
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
                onClick={() => window.history.back()}
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
