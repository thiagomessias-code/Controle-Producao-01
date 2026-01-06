import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import QRCodeScanner from "@/components/ui/QRCodeScanner";
import { useMortality } from "@/hooks/useMortality";
import { useBatches } from "@/hooks/useBatches";
import { useGroups } from "@/hooks/useGroups";
import { cagesApi } from "@/api/cages";
import { useWarehouse } from "@/hooks/useWarehouse";
import { useCages } from "@/hooks/useCages";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function RegisterMortality() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { groups } = useGroups();
  const { create, isCreating } = useMortality();
  const { batches, update: updateBatch } = useBatches();

  const { addInventory } = useWarehouse();
  const { cages } = useCages();
  const [showScanner, setShowScanner] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    groupId: "",
    cageId: "",
    date: new Date().toISOString().split("T")[0],
    quantity: "",
    cause: "Doença",
    notes: "",
  });
  const [error, setError] = useState("");

  // No manual batch detection needed - we use FIFO on submit

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleCageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cageId = e.target.value;
    setFormData(prev => ({ ...prev, cageId }));
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
        toast.success("Localização identificada!");
      } else {
        toast.error("QR Code não reconhecido");
      }
    } catch (e) {
      toast.error("Erro ao processar QR Code");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const qtyRequested = parseInt(formData.quantity);
    if (qtyRequested <= 0) {
      setError("Quantidade deve ser maior que zero");
      return;
    }

    // 1. Find all active batches in the cage and sort by birthDate (FIFO: oldest first)
    const activeBatchesInCage = batches
      ?.filter((b: any) => b.cageId === formData.cageId && b.status === "active")
      .sort((a, b) => {
        const dateA = new Date(a.birthDate || a.createdAt || 0).getTime();
        const dateB = new Date(b.birthDate || b.createdAt || 0).getTime();
        return dateA - dateB;
      }) || [];

    const totalAvailable = activeBatchesInCage.reduce((acc, b) => acc + (b.quantity || 0), 0);

    if (activeBatchesInCage.length === 0) {
      setError("Nenhum lote ativo detectado nesta gaiola.");
      return;
    }

    if (qtyRequested > totalAvailable) {
      setError(`Quantidade (${qtyRequested}) excede o saldo total da gaiola (${totalAvailable})`);
      return;
    }

    try {
      // Use current time if date is today
      const finalDate = formData.date === new Date().toISOString().split('T')[0]
        ? new Date().toISOString()
        : formData.date;

      for (const batch of activeBatchesInCage) {
        if (remainingToDeduct <= 0) break;

        const deductionFromThisBatch = Math.min(batch.quantity, remainingToDeduct);
        const newBatchQty = batch.quantity - deductionFromThisBatch;

        // Determine if batch is finished (0 birds)
        const isFinished = newBatchQty <= 0;

        // Create Mortality Record (Always, for history)
        await create({
          groupId: formData.groupId,
          cageId: formData.cageId,
          batchId: batch.id,
          date: finalDate,
          quantity: deductionFromThisBatch,
          cause: formData.cause,
          notes: `${formData.notes}${activeBatchesInCage.length > 1 ? ` (FIFO Lote #${batch.batchNumber})` : ''}`,
          userId: user?.id
        });

        // Handle Slaughter (Specific for Abate)
        if (formData.cause === "Abate") {
          const expirationDate = new Date(finalDate);
          expirationDate.setDate(expirationDate.getDate() + 5);

          await addInventory({
            type: "meat",
            subtype: `Abate - ${batch.species || 'Codorna'}`,
            quantity: deductionFromThisBatch,
            origin: {
              groupId: formData.groupId,
              batchId: batch.id,
              cageId: formData.cageId,
              date: finalDate
            },
            expirationDate: expirationDate.toISOString().split("T")[0]
          });
        }

        // b) Update Batch: History and New Quantity
        const newHistory = [
          ...(batch.history || []),
          {
            date: new Date().toISOString(),
            event: formData.cause === "Abate" ? "Abate (Saída)" : `Mortalidade (${formData.cause})`,
            quantity: deductionFromThisBatch,
            details: `${formData.cause === "Abate" ? "Abate para o armazém." : formData.notes}. Registrado por ${user?.name || "Sistema"}`,
            origin: batch.id
          }
        ];

        await updateBatch({
          id: batch.id,
          data: {
            quantity: newBatchQty,
            status: isFinished ? "inactive" : "active", // Finalize if zero
            history: newHistory
          }
        });

        remainingToDeduct -= deductionFromThisBatch;
      }

      // 3. Sync Cage Quantity (Total deduction across all batches)
      const currentCage = cages.find((c) => c.id === formData.cageId);
      if (currentCage) {
        await cagesApi.update(currentCage.id, {
          currentQuantity: Math.max(0, currentCage.currentQuantity - qtyRequested)
        });
      }

      toast.success("Registro concluído e estoque atualizado!");
      setLocation("/mortality");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao registrar abatimento.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => window.history.back()}>
            ⬅️ Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Registrar Abatimentos</h1>
            <p className="text-muted-foreground mt-1">
              Registre óbitos ou abates para o armazém
            </p>
          </div>
        </div>
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
                      cageId: ""
                    }));
                  }}
                  disabled={isCreating}
                  className="flex-1 px-4 py-2 rounded-lg border-2 border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
                >
                  <option value="">Selecione um grupo...</option>
                  {groups?.map((group: any) => (
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
