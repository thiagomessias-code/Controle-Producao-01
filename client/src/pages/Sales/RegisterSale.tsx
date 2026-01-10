import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useSales } from "@/hooks/useSales";
import { useGroups } from "@/hooks/useGroups";
import { useWarehouse } from "@/hooks/useWarehouse";
import { useAuth } from "@/hooks/useAuth";
import { formatDate, formatDateTime, getLocalISODate } from "@/utils/date";
import { formatCurrency } from "@/utils/format";
import { supabase } from "@/api/supabaseClient";
import { aviariesApi } from "@/api/aviaries";
import { toast } from "sonner";

interface ProductVariation {
  id: string;
  product_id: string;
  name: string;
  price: number;
  unit_type: string;
  active: boolean;
}

interface Product {
  id: string;
  nome: string;
  tipo: string;
  ativo: boolean;
  product_variations?: ProductVariation[];
}

export default function RegisterSale() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { groups, update: updateGroup } = useGroups();
  const { create, isCreating, sales, isLoading: isLoadingSales } = useSales();
  const { inventory, processSale } = useWarehouse();

  const [products, setProducts] = useState<Product[]>([]);
  const [aviaries, setAviaries] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [step, setStep] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);

  const [formData, setFormData] = useState({
    groupId: "",
    date: new Date().toISOString().split("T")[0],
    quantity: "1",
    buyer: "",
    paymentMethod: "cash" as "cash" | "check" | "transfer" | "other",
    notes: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProducts();
    aviariesApi.getAll().then(setAviaries);
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*, product_variations(*)')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      // Filter out products with no active variations or inactive products
      const validProducts = (data || []).map(p => ({
        ...p,
        product_variations: (p.product_variations || []).filter((v: ProductVariation) => v.active !== false)
      })).filter(p => p.product_variations.length > 0);

      setProducts(validProducts);
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Helper: Get Available Stock for Eggs/Meat
  // Helper: Get Available Stock for Eggs/Meat/Animals
  const getAvailableStock = (name: string) => {
    const target = name.toLowerCase();

    // Logic for Chicks (Pintos) - Use Warehouse Inventory as requested
    // Previously we summed active groups, but user stated stock is in Warehouse (Armazém).
    // So we let it fall through to the default inventory logic below which matches by name.

    // Default: Warehouse Inventory (Eggs, Meat, Feed, Meds, etc.)
    return inventory
      .filter(i => {
        if (i.status !== "in_stock") return false;
        const invName = (i.subtype || "").toLowerCase();

        // Specific mapping for Meat/Slaughter
        if ((target.includes('abatida') || target.includes('abate')) &&
          (invName.includes('abatida') || invName.includes('abate') || i.type === 'meat')) {
          return true;
        }

        // Remove 's' from both ends for comparison (singular handling)
        const normalize = (str: string) => str.replace(/s$/, "");
        const targetNorm = normalize(target);
        const invNorm = normalize(invName);

        // Special case for Pintos: match 'codorna pinto' with 'pintos' or 'pinto'
        if (targetNorm.includes('pinto') && invNorm.includes('pinto')) return true;

        // General fuzzy match (bidirectional)
        return invName.includes(targetNorm) || target.includes(invNorm) || invNorm.includes(target);
      })
      .reduce((acc, i) => acc + i.quantity, 0);
  };

  // Helper: Get FIFO Suggestions (Oldest Batches First)
  const getFifoSuggestions = (productName: string) => {
    const target = productName.toLowerCase().replace(/s$/, ""); // Normalize

    return inventory
      .filter(i => {
        if (i.status !== "in_stock") return false;
        const invName = i.subtype.toLowerCase();
        if (target.includes('pinto') && invName.includes('pinto')) return true;
        return invName.includes(target) || target.includes(invName);
      })
      .sort((a, b) => new Date(a.origin.date).getTime() - new Date(b.origin.date).getTime())
      .slice(0, 3); // Get top 3 oldest
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

  const calculateTotal = () => {
    if (!selectedVariation) return 0;
    return selectedVariation.price * parseInt(formData.quantity || "0");
  };

  const handleStep1 = (prod: Product) => {
    setSelectedProduct(prod);
    // Auto-select first variation if only one
    if (prod.product_variations && prod.product_variations.length === 1) {
      setSelectedVariation(prod.product_variations[0]);
    } else {
      setSelectedVariation(null);
    }
    setStep(2);
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedProduct || !selectedVariation) {
      setError("Selecione uma variação.");
      return;
    }

    const qty = parseInt(formData.quantity);
    if (!qty || qty <= 0) {
      setError("Quantidade inválida.");
      return;
    }

    // Strict Stock Validation
    const stockName = selectedProduct.nome; // Use full name
    const available = getAvailableStock(stockName);

    // Only block if we ACTUALLY found stock (available > 0) OR if we are sure it should exist.
    // But user requested Strict Mode: "o fluxo da venda não pode seguir se nao houver em estoque"
    // So if available is 0, we BLOCK.

    if (available < qty) {
      setError(`Estoque insuficiente! Disponível: ${available}. Solicitado: ${qty}.`);
      return;
    }

    setStep(3);
  };

  const handleSubmit = async () => {
    if (!selectedProduct || !selectedVariation) return;

    try {
      const qty = parseInt(formData.quantity);

      // Stock Deduction
      const isEgg = selectedProduct.tipo === "ovo" || selectedProduct.nome.toLowerCase().includes('ovo');
      const isMeat = selectedProduct.tipo === "carne" || selectedProduct.nome.toLowerCase().includes('abatida') || selectedProduct.nome.toLowerCase().includes('abate');
      const isLive = selectedProduct.tipo === "ave_viva";

      let originTag = "";
      if (isEgg || isMeat || isLive) {
        let stockSubtype = selectedProduct.nome;

        // Find the EXACT subtype present in inventory to avoid mismatch during processSale
        const availableItems = inventory.filter(i => {
          if (i.status !== "in_stock") return false;
          const invName = (i.subtype || "").toLowerCase();
          const target = selectedProduct.nome.toLowerCase();

          if (isMeat && (invName.includes('abate') || invName.includes('abatida') || i.type === 'meat')) return true;
          if (isEgg && (invName.includes('ovo') || i.type === 'egg')) return true;
          if (isLive && (invName.includes('pinto') || i.type === 'chick')) return true;

          return invName.includes(target) || target.includes(invName);
        });

        if (availableItems.length > 0) {
          // Use the subtype from the most relevant item in inventory
          stockSubtype = availableItems[0].subtype;
        }

        const origins = await processSale(
          isEgg ? 'egg' : (isLive ? 'chick' : 'meat'),
          stockSubtype,
          qty
        );

        // Extract Aviary Names from Origins
        const aviaryIds = new Set(origins.map(o => {
          const group = groups.find(g => String(g.id) === String(o.groupId));
          return group?.aviaryId;
        }).filter(Boolean));

        const names = Array.from(aviaryIds)
          .map(id => aviaries.find(a => String(a.id) === String(id))?.name)
          .filter(Boolean);

        if (names.length > 0) {
          originTag = ` [Origem: ${names.join(', ')}]`;
        }
      }

      // Check if selected date is today (locally)
      const localToday = getLocalISODate();

      const finalDate = formData.date === localToday
        ? new Date().toISOString()
        : `${formData.date}T12:00:00`; // Use noon for historical dates to avoid TZ shifts

      // Create Sale Record
      await create({
        groupId: formData.groupId || "warehouse",
        date: finalDate,
        quantity: qty,
        unitPrice: selectedVariation.price,
        buyer: formData.buyer,
        productType: selectedProduct.nome, // Storing Name as type for legibility
        product_variation_id: selectedVariation.id,
        userId: user?.id,
        paymentMethod: formData.paymentMethod,
        notes: `Variação: ${selectedVariation.name}. ${formData.notes}${originTag}`,
      });

      setLocation("/sales");
      toast.success("Venda registrada com sucesso!");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao registrar venda");
    }
  };

  if (loadingProducts) return <p className="p-8 text-center">Carregando produtos...</p>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => window.history.back()}>
            ⬅️ Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Registrar Venda 💰</h1>
            <p className="text-muted-foreground mt-1">
              Lance novas vendas de produtos e aves.
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setLocation("/sales")}>
          Ver Histórico
        </Button>
      </div>

      {/* STEP 1: SELECT PRODUCT */}
      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {products.map(prod => (
            <Card
              key={prod.id}
              className="cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1 block"
              onClick={() => handleStep1(prod)}
            >
              <CardContent className="p-8 text-center space-y-4">
                <span className="text-4xl text-blue-500">📦</span>
                <h3 className="text-xl font-bold text-foreground capitalize">{prod.nome}</h3>
                <p className="text-sm text-gray-400">{prod.product_variations?.length} opções</p>
              </CardContent>
            </Card>
          ))}
          {products.length === 0 && <p className="col-span-3 text-center text-gray-500">Nenhum produto cadastrado.</p>}
        </div>
      )}

      {/* STEP 2: DETAILS */}
      {step === 2 && selectedProduct && (
        <Card>
          <CardHeader>
            <CardTitle>Venda de {selectedProduct.nome}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStep2} className="space-y-6">
              {error && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <label className="block text-sm font-medium text-foreground">Escolha a Opção</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedProduct.product_variations?.map(v => (
                    <div
                      key={v.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors flex justify-between items-center ${selectedVariation?.id === v.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'hover:bg-gray-50'}`}
                      onClick={() => setSelectedVariation(v as ProductVariation)}
                    >
                      <span className="font-medium">{v.name}</span>
                      <span className="font-bold text-blue-700">{formatCurrency(v.price)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stock Indicator - Universal */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Quantidade"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="0"
                />

                <div className={`text-sm mt-1 p-2 rounded ${getAvailableStock(selectedProduct.nome) > 0
                  ? 'bg-blue-50 text-blue-700 border border-blue-100'
                  : 'bg-red-50 text-red-700 border border-red-100'
                  }`}>
                  <span className="font-bold">Em Estoque: </span>
                  {getAvailableStock(selectedProduct.nome)}
                </div>

                {/* FIFO Sugestion */}
                {getAvailableStock(selectedProduct.nome) > 0 && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                    <p className="font-bold text-yellow-800 mb-1">💡 Sugestão de Venda (FIFO):</p>
                    <ul className="space-y-1">
                      {getFifoSuggestions(selectedProduct.nome).map((item, idx) => (
                        <li key={item.id} className="text-yellow-700">
                          {idx + 1}. {item.subtype} (Lote: {item.origin.batchId || 'N/A'}) - {new Date(item.origin.date).toLocaleDateString()}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="bg-gray-100 p-4 rounded flex flex-col justify-center">
                  <span className="text-sm text-gray-500">Total Estimado</span>
                  <span className="text-2xl font-bold text-green-700">
                    {formatCurrency((selectedVariation?.price || 0) * parseInt(formData.quantity || '0'))}
                  </span>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" variant="primary" disabled={!selectedVariation}>Continuar →</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: CONFIRMATION */}
      {step === 3 && selectedProduct && selectedVariation && (
        <Card>
          <CardHeader>
            <CardTitle>Finalizar Venda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Produto:</span>
                <span className="font-medium capitalize">{selectedProduct.nome} - {selectedVariation.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantidade:</span>
                <span className="font-bold text-lg">{formData.quantity}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-bold text-xl text-green-700">{formatCurrency(calculateTotal())}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Comprador"
                value={formData.buyer}
                onChange={e => setFormData({ ...formData, buyer: e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Pagamento</label>
                <select
                  value={formData.paymentMethod}
                  onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as any })}
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
              <Input
                label="Notas"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
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
      {/* Recent History Table */}
      <Card className="mt-8 border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Vendas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="p-3 font-semibold">Data</th>
                  <th className="p-3 font-semibold">Produto</th>
                  <th className="p-3 font-semibold text-right">Qtd</th>
                  <th className="p-3 font-semibold text-right">Total</th>
                  <th className="p-3 font-semibold">Comprador</th>
                  <th className="p-3 font-semibold text-xs">Vendedor</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoadingSales ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Carregando...</td></tr>
                ) : sales.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhuma venda registrada recentemente.</td></tr>
                ) : (
                  sales.slice(0, 10).map(sale => (
                    <tr key={sale.id} className="hover:bg-muted/30">
                      <td className="p-3">{formatDate(sale.date)}</td>
                      <td className="p-3 font-medium capitalize">{sale.productType}</td>
                      <td className="p-3 text-right">{sale.quantity}</td>
                      <td className="p-3 text-right font-medium text-green-700">
                        {formatCurrency(sale.totalPrice || (sale.unitPrice * sale.quantity))}
                      </td>
                      <td className="p-3 text-xs">{sale.buyer || "-"}</td>
                      <td className="p-3 text-xs font-medium text-blue-700">{sale.userName || "Sistema"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-center">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/sales")}>
              Ver Histórico Completo →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
