import { useState } from "react";
import { useLocation } from "wouter";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useSales } from "@/hooks/useSales";
import { useGroups } from "@/hooks/useGroups";
import { useWarehouse } from "@/hooks/useWarehouse";
import { formatDate } from "@/utils/date";
import { formatQuantity } from "@/utils/format";

export default function RegisterSale() {
  const [, setLocation] = useLocation();
  const { groups, update: updateGroup } = useGroups();
  const { create, isCreating } = useSales();
  const { inventory, processSale } = useWarehouse();

  const [step, setStep] = useState(1);
  const [saleType, setSaleType] = useState<"egg" | "meat" | "chick" | null>(null);
  const [formData, setFormData] = useState({
    groupId: "",
    date: new Date().toISOString().split("T")[0],
    quantity: "",
    unitPrice: "",
    buyer: "",
    productType: "ovo cru",
    paymentMethod: "cash",
    notes: "",
  });
  const [error, setError] = useState("");

  // Helper: Get Available Stock for Eggs/Meat
  const getAvailableStock = (subtype: string) => {
    return inventory
      .filter(i => i.subtype === subtype && i.status === "in_stock")
      .reduce((acc, i) => acc + i.quantity, 0);
  };

  // Helper: Get FIFO Suggestions for Eggs
  const getFifoSuggestions = (subtype: string, qty: number) => {
    const items = inventory
      .filter(i => i.subtype === subtype && i.status === "in_stock")
      .sort((a, b) => new Date(a.origin.date).getTime() - new Date(b.origin.date).getTime());

    let remaining = qty;
    const suggestions = [];

    for (const item of items) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, item.quantity);
      suggestions.push({ ...item, take });
      remaining -= take;
    }
    return suggestions;
  };

  // Helper: Get Available Chicks (>20 days)
  const getAvailableChicks = () => {
    const today = new Date();
    return groups.filter(g => {
      if (g.status !== "active" || g.phase !== "crescimento") return false;
      if (!g.birthDate) return false;
      const birthDate = new Date(g.birthDate);
      const ageInDays = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
      return ageInDays >= 20;
    });
  };

  const handleStep1 = (type: "egg" | "meat" | "chick") => {
    setSaleType(type);
    // Set default product type based on selection
    if (type === "egg") setFormData(prev => ({ ...prev, productType: "ovo cru" }));
    if (type === "meat") setFormData(prev => ({ ...prev, productType: "codorna abatida" }));
    if (type === "chick") setFormData(prev => ({ ...prev, productType: "codorna pinto" }));
    setStep(2);
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const qty = parseInt(formData.quantity);
    if (!qty || qty <= 0) {
      setError("Quantidade inválida.");
      return;
    }

    if (saleType === "egg" || saleType === "meat") {
      const available = getAvailableStock(formData.productType);
      if (qty > available) {
        setError(`Estoque insuficiente. Disponível: ${available}`);
        return;
      }
    } else if (saleType === "chick") {
      const availableChicks = getAvailableChicks().reduce((acc, g) => acc + g.quantity, 0);
      if (qty > availableChicks) {
        setError(`Quantidade de pintos (20+ dias) insuficiente. Disponível: ${availableChicks}`);
        return;
      }
    }

    setStep(3);
  };

  const handleSubmit = async () => {
    try {
      const qty = parseInt(formData.quantity);

      if (saleType === "egg" || saleType === "meat") {
        const type = saleType === "egg" ? "egg" : "meat";
        await processSale(type, formData.productType, qty);
      } else if (saleType === "chick") {
        // Logic to deduct chicks from groups (oldest first or manual selection? Prompt implies auto validation)
        // We will deduct from oldest eligible groups
        const eligibleGroups = getAvailableChicks().sort((a, b) => new Date(a.birthDate!).getTime() - new Date(b.birthDate!).getTime());
        let remaining = qty;

        for (const group of eligibleGroups) {
          if (remaining <= 0) break;
          const take = Math.min(remaining, group.quantity);

          const newHistory = [
            ...(group.history || []),
            {
              date: new Date().toISOString(),
              event: "Venda de Pintos",
              quantity: take,
              details: `Venda de ${take} pintos. Comprador: ${formData.buyer}`
            }
          ];

          await updateGroup({
            id: group.id,
            data: {
              quantity: group.quantity - take,
              history: newHistory,
              // If quantity becomes 0, maybe mark as sold? For now just reduce.
              status: (group.quantity - take) === 0 ? "sold" : "active"
            }
          });
          remaining -= take;
        }
      }

      // Create Sale Record
      await create({
        groupId: formData.groupId || "warehouse", // Use 'warehouse' for stock sales
        date: formData.date,
        quantity: qty,
        unitPrice: parseFloat(formData.unitPrice),
        buyer: formData.buyer,
        productType: formData.productType,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
      });

      setLocation("/sales");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao registrar venda");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        {step > 1 && (
          <button onClick={() => setStep(step - 1)} className="p-2 hover:bg-gray-100 rounded-full">
            ←
          </button>
        )}
        <h1 className="text-3xl font-bold text-foreground">Nova Venda</h1>
      </div>

      {/* STEP 1: SELECTION */}
      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card
            className="cursor-pointer hover:shadow-xl transition-all border-l-8 border-l-yellow-400 hover:-translate-y-1"
            onClick={() => handleStep1("egg")}
          >
            <CardContent className="p-8 text-center space-y-4">
              <span className="text-6xl">🥚</span>
              <h3 className="text-2xl font-bold text-foreground">Ovos</h3>
              <p className="text-muted-foreground">Venda de ovos (Cru, Galado, Conserva)</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-xl transition-all border-l-8 border-l-red-500 hover:-translate-y-1"
            onClick={() => handleStep1("meat")}
          >
            <CardContent className="p-8 text-center space-y-4">
              <span className="text-6xl">🍖</span>
              <h3 className="text-2xl font-bold text-foreground">Abatidos</h3>
              <p className="text-muted-foreground">Venda de carne e processados</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-xl transition-all border-l-8 border-l-blue-500 hover:-translate-y-1"
            onClick={() => handleStep1("chick")}
          >
            <CardContent className="p-8 text-center space-y-4">
              <span className="text-6xl">🐥</span>
              <h3 className="text-2xl font-bold text-foreground">Pintos</h3>
              <p className="text-muted-foreground">Venda de pintos (+20 dias)</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* STEP 2: DETAILS */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Venda ({saleType === 'egg' ? 'Ovos' : saleType === 'meat' ? 'Abatidos' : 'Pintos'})</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStep2} className="space-y-6">
              {error && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Tipo de Produto</label>
                  <select
                    value={formData.productType}
                    onChange={e => setFormData({ ...formData, productType: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-input bg-background"
                  >
                    {saleType === "egg" && (
                      <>
                        <option value="ovo cru">Ovo Cru</option>
                        <option value="ovo galado">Ovo Galado</option>
                        <option value="ovo em conserva">Ovo em Conserva</option>
                      </>
                    )}
                    {saleType === "meat" && (
                      <>
                        <option value="codorna abatida">Codorna Abatida</option>
                        <option value="churrasco codorna">Churrasco Codorna</option>
                      </>
                    )}
                    {saleType === "chick" && (
                      <option value="codorna pinto">Codorna Pinto</option>
                    )}
                  </select>
                </div>

                <Input
                  label="Quantidade"
                  type="number"
                  value={formData.quantity}
                  onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="0"
                />
              </div>

              {/* DYNAMIC INFO BLOCKS */}
              {saleType === "egg" && formData.quantity && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-bold text-yellow-800 mb-2">Sugestão de Retirada (FIFO)</h4>
                  <div className="space-y-2">
                    {getFifoSuggestions(formData.productType, parseInt(formData.quantity)).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm text-yellow-900">
                        <span>Lote {item.origin.batchId?.slice(0, 8)}... ({formatDate(item.origin.date)})</span>
                        <span className="font-bold">Retirar: {item.take}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {saleType === "chick" && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-bold text-blue-800 mb-2">Grupos Disponíveis (+20 dias)</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {getAvailableChicks().map(g => {
                      const age = Math.floor((new Date().getTime() - new Date(g.birthDate!).getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <div key={g.id} className="flex justify-between text-sm text-blue-900">
                          <span>{g.name} ({age} dias)</span>
                          <span className="font-bold">{g.quantity} un.</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button type="submit" variant="primary">Continuar →</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: CONFIRMATION */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Finalizar Venda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Produto:</span>
                <span className="font-medium capitalize">{formData.productType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantidade:</span>
                <span className="font-bold text-lg">{formData.quantity}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Preço Unitário (R$)"
                type="number"
                step="0.01"
                value={formData.unitPrice}
                onChange={e => setFormData({ ...formData, unitPrice: e.target.value })}
              />
              <Input
                label="Comprador"
                value={formData.buyer}
                onChange={e => setFormData({ ...formData, buyer: e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Pagamento</label>
                <select
                  value={formData.paymentMethod}
                  onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-input bg-background"
                >
                  <option value="cash">Dinheiro</option>
                  <option value="check">Cheque</option>
                  <option value="transfer">Transferência</option>
                  <option value="other">Outro</option>
                </select>
              </div>
              <Input
                label="Data"
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setStep(2)}
              >
                Voltar
              </Button>
              <Button
                type="button"
                variant="primary"
                className="flex-1"
                onClick={handleSubmit}
                isLoading={isCreating}
              >
                Confirmar Venda
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
