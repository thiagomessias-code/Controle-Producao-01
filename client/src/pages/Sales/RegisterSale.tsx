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
import {
  ShoppingBag,
  ChevronLeft,
  CheckCircle2,
  Package,
  User,
  CreditCard,
  Calendar,
  FileText,
  ArrowRight,
  TrendingDown,
  Info,
  Layers,
  Archive
} from "lucide-react";

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
  controla_estoque?: boolean;
  ficha_tecnica?: any[];
  product_variations?: ProductVariation[];
}

export default function RegisterSale() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { groups } = useGroups();
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
    paymentMethod: "cash" as "cash" | "payment_app" | "transfer" | "other",
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

  const getAvailableStock = (name: string, typeHint?: string): number => {
    let target = name.toLowerCase();
    const product = products.find(p => p.nome.toLowerCase() === target);

    if (product && product.controla_estoque === false && product.ficha_tecnica) {
      if (product.ficha_tecnica.length === 0) return 0;
      const ingredientAvailabilities = product.ficha_tecnica.map(ing => {
        const availableIng = getAvailableStock(ing.raw_material_name, ing.stock_type);
        return Math.floor(availableIng / ing.quantity);
      });
      return Math.min(...ingredientAvailabilities);
    }

    return inventory
      .filter(i => {
        if (i.status !== "in_stock") return false;
        if (typeHint && i.type !== typeHint) return false;
        const invName = (i.subtype || "").toLowerCase();
        if ((target.includes('abatida') || target.includes('abate')) &&
          (invName.includes('abatida') || invName.includes('abate') || i.type === 'meat')) {
          return true;
        }
        const normalize = (str: string) => str.replace(/s\b/g, "").replace(/\s+/g, " ").trim();
        const targetNorm = normalize(target);
        const invNorm = normalize(invName);
        return invNorm.includes(targetNorm) || targetNorm.includes(invNorm);
      })
      .reduce((acc, i) => acc + i.quantity, 0);
  };

  const getFifoSuggestions = (productName: string) => {
    const target = productName.toLowerCase();
    const product = products.find(p => p.nome.toLowerCase() === target);

    if (product && product.controla_estoque === false && product.ficha_tecnica) {
      if (product.ficha_tecnica.length > 0) {
        return getFifoSuggestions(product.ficha_tecnica[0].raw_material_name);
      }
      return [];
    }

    return inventory
      .filter(i => {
        if (i.status !== "in_stock") return false;
        const invName = i.subtype.toLowerCase();
        return invName.includes(target) || target.includes(invName);
      })
      .sort((a, b) => new Date(a.origin.date).getTime() - new Date(b.origin.date).getTime())
      .slice(0, 3);
  };

  const calculateTotal = () => {
    if (!selectedVariation) return 0;
    return selectedVariation.price * parseInt(formData.quantity || "0");
  };

  const handleStep1 = (prod: Product) => {
    setSelectedProduct(prod);
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

    const available = getAvailableStock(selectedProduct.nome);
    if (available < qty) {
      const msg = selectedProduct.controla_estoque === false
        ? `Insumos insuficientes para produzir! Disponível: ${available}. Solicitado: ${qty}.`
        : `Estoque insuficiente! Disponível: ${available}. Solicitado: ${qty}.`;
      setError(msg);
      return;
    }

    setStep(3);
  };

  const handleSubmit = async () => {
    if (!selectedProduct || !selectedVariation) return;

    try {
      const qty = parseInt(formData.quantity);
      const isEgg = selectedProduct.tipo === "ovo" || selectedProduct.nome.toLowerCase().includes('ovo');
      const isMeat = selectedProduct.tipo === "carne" || selectedProduct.nome.toLowerCase().includes('abatida');
      const isLive = selectedProduct.tipo === "ave_viva";

      let originTag = "";
      const isDerivative = selectedProduct.controla_estoque === false;

      if (isEgg || isMeat || isLive || isDerivative) {
        let stockSubtype = selectedProduct.nome;
        let stockType: "egg" | "meat" | "chick" = isEgg ? 'egg' : (isLive ? 'chick' : (isMeat ? 'meat' : 'egg'));

        const origins = await processSale(
          stockType,
          stockSubtype,
          qty,
          "venda",
          selectedProduct.ficha_tecnica
        );

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

      const localToday = getLocalISODate();
      const finalDate = formData.date === localToday ? new Date().toISOString() : `${formData.date}T12:00:00`;

      await create({
        groupId: formData.groupId || "warehouse",
        date: finalDate,
        quantity: qty,
        unitPrice: selectedVariation.price,
        buyer: formData.buyer,
        productType: selectedProduct.nome,
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

  if (loadingProducts) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-xs">Carregando Estoque...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Premium Header */}
      <div className="relative overflow-hidden bg-white p-8 rounded-[2rem] shadow-xl shadow-blue-50 border border-blue-50/50">
        <div className="absolute top-0 right-0 -m-8 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 -m-8 w-48 h-48 bg-indigo-50 rounded-full blur-2xl opacity-40"></div>

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="group p-3 bg-gray-50 hover:bg-white hover:shadow-md rounded-2xl transition-all border border-gray-100 flex items-center justify-center h-14 w-14"
              >
                <ChevronLeft size={24} className="text-gray-600 group-hover:-translate-x-1 transition-transform" />
              </button>
            ) : (
              <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-[1.5rem] shadow-lg shadow-blue-200 h-14 w-14 flex items-center justify-center">
                <ShoppingBag size={28} />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none">Checkout</h1>
              <p className="text-gray-400 font-semibold mt-2 flex items-center gap-2">
                {step === 1 ? 'Selecione o produto para a venda' : step === 2 ? 'Defina as quantidades e variações' : 'Revise e confirme a transação'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-2xl border border-gray-100 pr-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2 line-clamp-1">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all ${step >= s ? 'bg-blue-600 text-white shadow-md shadow-blue-100 scale-110' : 'bg-white text-gray-400 border border-gray-200'}`}>
                  {step > s ? <CheckCircle2 size={14} /> : s}
                </div>
                {s < 3 && <div className={`w-8 h-1 rounded-full ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`}></div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-2">
          <div className="bg-red-500 text-white p-2 rounded-xl h-10 w-10 flex items-center justify-center">
            <Info size={20} />
          </div>
          <div className="flex-1">
            <p className="text-red-800 font-black text-sm uppercase tracking-wide">Erro no Processamento</p>
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* STEP 1: PRODUCT SELECTION */}
      {step === 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(prod => {
            const stock = getAvailableStock(prod.nome);
            return (
              <Card
                key={prod.id}
                className="group relative cursor-pointer border-none shadow-sm hover:shadow-2xl hover:shadow-blue-100 transition-all duration-500 hover:-translate-y-2 rounded-[2rem] overflow-hidden"
                onClick={() => handleStep1(prod)}
              >
                <div className="absolute top-0 right-0 m-4 py-1 px-3 bg-white/80 backdrop-blur-sm rounded-full text-[10px] font-black border border-gray-100 tracking-widest text-gray-500 uppercase">
                  {prod.tipo}
                </div>
                <CardContent className="p-8 space-y-6">
                  <div className="h-16 w-16 bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white rounded-[1.25rem] flex items-center justify-center transition-all duration-500 shadow-inner">
                    <Package size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 group-hover:text-blue-600 transition-colors capitalize tracking-tight">{prod.nome}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`h-2 w-2 rounded-full ${stock > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                      <p className="text-sm font-bold text-gray-400 capitalize">{prod.product_variations?.length} Variações disponíveis</p>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-gray-50 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Estoque Disp.</p>
                      <p className={`text-xl font-black tabular-nums ${stock > 0 ? 'text-gray-900' : 'text-red-400'}`}>{stock}</p>
                    </div>
                    <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <ArrowRight size={20} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* STEP 2: QUANTITY & VARIATION */}
      {step === 2 && selectedProduct && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-12 space-y-6">
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 h-full w-1/3 bg-white/10 skew-x-12 translate-x-10"></div>
                <div className="relative flex justify-between items-center">
                  <div>
                    <p className="text-blue-100 text-xs font-black uppercase tracking-widest">Configuração do Item</p>
                    <h2 className="text-4xl font-black mt-2 capitalize tracking-tight">{selectedProduct.nome}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-100 text-xs font-black uppercase tracking-widest">Saldo Atual</p>
                    <p className="text-4xl font-black mt-2 tabular-nums">{getAvailableStock(selectedProduct.nome)}</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-8">
                <form onSubmit={handleStep2} className="space-y-10 group">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <TrendingDown size={18} />
                      </div>
                      <Label className="text-sm font-black text-gray-700 uppercase tracking-widest">1. Selecione a Variação de Venda</Label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedProduct.product_variations?.map(v => (
                        <div
                          key={v.id}
                          className={`relative group cursor-pointer p-6 rounded-[2rem] border-2 transition-all duration-300 ${selectedVariation?.id === v.id
                              ? 'border-blue-600 bg-blue-50/30'
                              : 'border-gray-100 hover:border-blue-100 hover:bg-gray-50'
                            }`}
                          onClick={() => setSelectedVariation(v as ProductVariation)}
                        >
                          {selectedVariation?.id === v.id && (
                            <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full p-1 shadow-lg shadow-blue-200">
                              <CheckCircle2 size={16} />
                            </div>
                          )}
                          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{v.unit_type}</p>
                          <h4 className="text-lg font-black text-gray-900 mt-1">{v.name}</h4>
                          <p className="text-2xl font-black text-blue-600 mt-3 tabular-nums">{formatCurrency(v.price)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                          <Layers size={18} />
                        </div>
                        <Label className="text-sm font-black text-gray-700 uppercase tracking-widest">2. Informe a Quantidade</Label>
                      </div>
                      <div className="relative group">
                        <input
                          type="number"
                          value={formData.quantity}
                          onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                          className="w-full text-5xl font-black p-8 pb-10 rounded-[2rem] bg-gray-50 border-none focus:ring-4 focus:ring-blue-100 transition-all outline-none tabular-nums text-gray-900"
                          placeholder="0"
                        />
                        <div className="absolute bottom-6 right-8 text-sm font-black text-gray-400 uppercase tracking-widest">Unidades / Itens</div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-end space-y-6">
                      <div className="p-8 rounded-[2rem] bg-emerald-50 border border-emerald-100/50 flex flex-col gap-2">
                        <p className="text-emerald-600 text-xs font-black uppercase tracking-widest">Total Parcial</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-black text-emerald-700 tabular-nums">
                            {formatCurrency((selectedVariation?.price || 0) * parseInt(formData.quantity || '0'))}
                          </span>
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-[2rem] shadow-xl shadow-blue-100 group transition-all"
                        disabled={!selectedVariation}
                      >
                        Próximo Passo <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* STEP 3: CONFIRMATION & DETAILS */}
      {step === 3 && selectedProduct && selectedVariation && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            <Card className="border-none shadow-xl rounded-[2rem] bg-white">
              <CardHeader className="p-8 pb-0">
                <CardTitle className="text-2xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center">
                    <CheckCircle2 size={24} />
                  </div>
                  Detalhes da Transação
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <User size={14} className="text-blue-500" /> Nome do Comprador
                    </Label>
                    <input
                      value={formData.buyer}
                      onChange={e => setFormData({ ...formData, buyer: e.target.value })}
                      className="w-full h-14 px-6 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 ring-inset transition-all outline-none font-bold text-gray-800"
                      placeholder="Quem está comprando?"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <CreditCard size={14} className="text-blue-500" /> Método de Pagamento
                    </Label>
                    <select
                      value={formData.paymentMethod}
                      onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                      className="w-full h-14 px-6 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 ring-inset transition-all outline-none font-bold text-gray-800 appearance-none cursor-pointer"
                    >
                      <option value="cash">Dinheiro</option>
                      <option value="payment_app">Pix / App</option>
                      <option value="transfer">Transferência Bancária</option>
                      <option value="other">Outro</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={14} className="text-blue-500" /> Data da Venda
                    </Label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                      className="w-full h-14 px-6 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 ring-inset transition-all outline-none font-bold text-gray-800"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <FileText size={14} className="text-blue-500" /> Observações Internas
                    </Label>
                    <input
                      value={formData.notes}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full h-14 px-6 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 ring-inset transition-all outline-none font-bold text-gray-800"
                      placeholder="Opcional..."
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={handleSubmit}
                    isLoading={isCreating}
                    className="w-full h-20 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xl rounded-[2.5rem] shadow-2xl shadow-emerald-100 flex items-center justify-center gap-4 transition-all group"
                  >
                    Confirmar e Finalizar Venda <CheckCircle2 size={28} className="group-hover:scale-125 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <Card className="border-none shadow-xl rounded-[2rem] bg-gray-900 text-white overflow-hidden sticky top-8">
              <div className="p-8 space-y-8">
                <div>
                  <h3 className="text-lg font-black text-indigo-300 uppercase tracking-[0.2em]">Resumo do Pedido</h3>
                  <div className="mt-6 flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center font-black text-xl">1</div>
                    <div>
                      <h4 className="font-black text-lg capitalize">{selectedProduct.nome}</h4>
                      <p className="text-gray-400 text-sm">{selectedVariation.name} × {formData.quantity}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-8 border-t border-white/10">
                  <div className="flex justify-between items-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                    <span>Preço Unitário</span>
                    <span className="text-white">{formatCurrency(selectedVariation.price)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                    <span>Subtotal</span>
                    <span className="text-white tabular-nums">{formatCurrency(calculateTotal())}</span>
                  </div>
                  <div className="flex justify-between items-center pt-6 border-t border-white/10 group">
                    <span className="text-indigo-300 font-black uppercase tracking-widest text-sm group-hover:text-indigo-200 transition-colors">Total a Receber</span>
                    <span className="text-4xl font-black text-white tabular-nums tracking-tight">
                      {formatCurrency(calculateTotal())}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Modern Dashboard Link Section */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gray-50 text-gray-400 rounded-2xl">
            <Archive size={24} />
          </div>
          <div>
            <h4 className="font-black text-gray-900">Histórico de Movimentações</h4>
            <p className="text-gray-400 text-sm font-semibold">Visualize todas as vendas processadas este ano.</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setLocation("/sales")}
          className="rounded-[1.25rem] h-14 px-8 border-gray-100 font-black hover:bg-gray-50 transition-all text-sm uppercase tracking-widest"
        >
          Acessar Relatório Completo
        </Button>
      </div>
    </div>
  );
}
