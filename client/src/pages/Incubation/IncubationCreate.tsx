import { useState } from "react";
import { useLocation } from "wouter";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { useIncubation } from "@/hooks/useIncubation";
import { useWarehouse } from "@/hooks/useWarehouse";
import { useGroups } from "@/hooks/useGroups";
import { toast } from "sonner";

export default function IncubationCreate() {
  const [, setLocation] = useLocation();
  const { create, isCreating } = useIncubation();
  const { inventory, processSale } = useWarehouse(); // For stock deduction

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
    eggSource: "warehouse" as "warehouse" | "other",
  });
  const [error, setError] = useState("");

  // Helper: Get Fertile Eggs Stock
  const getFertileEggsStock = () => {
    return inventory
      .filter(i => {
        if (i.status !== "in_stock") return false;
        const name = i.subtype.toLowerCase();
        // Match any common term for fertile eggs
        return (name.includes('ovo') && (name.includes('fertil') || name.includes('fértil') || name.includes('galado') || name.includes('incuba')));
      })
      .reduce((acc, i) => acc + i.quantity, 0);
  };

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

    const qty = parseInt(formData.eggQuantity);

    // Stock Validation
    if (formData.eggSource === 'warehouse') {
      const available = getFertileEggsStock();
      if (qty > available) {
        setError(`Estoque insuficiente de Ovos Férteis! Disponível: ${available}`);
        return;
      }
    }

    try {
      let notesWithSource = `Fonte dos Ovos: ${formData.eggSource === 'warehouse' ? 'Armazém' : 'Outro'}. ${formData.notes}`;

      // Stock Deduction
      if (formData.eggSource === 'warehouse') {
        const usage = await processSale('egg', 'ovo fértil', qty, 'incubacao'); // Deducts from inventory
        if (usage && usage.length > 0) {
          const rastro = usage.map(u => {
            const batchPart = u.batchId ? `Lote: ${u.batchId.slice(0, 8)}` : '';
            const cagePart = u.cageId ? `Gaiola: ${u.cageId.slice(0, 8)}` : '';
            const text = [batchPart, cagePart].filter(Boolean).join(' / ');
            return `${u.quantity} un (${text || 'Origem interna'})`;
          }).join('; ');
          notesWithSource += ` | Rastro Automático: ${rastro}`;
        }
      }

      await create({
        batchNumber: formData.batchNumber,
        eggQuantity: qty,
        species: formData.species,
        startDate: formData.startDate,
        expectedHatchDate: formData.expectedHatchDate,
        temperature: parseFloat(formData.temperature),
        humidity: parseFloat(formData.humidity),
        notes: notesWithSource,
        status: "incubating",
        history: [
          {
            date: new Date().toISOString(),
            event: "Lote Criado",
            quantity: qty,
            details: `Início da incubação com ${qty} ovos. Fonte: ${formData.eggSource === 'warehouse' ? 'Armazém' : 'Outro'}.`,
          }
        ]
      });
      toast.success("Lote de incubação criado com sucesso!");
      setLocation("/incubation");
    } catch (err: any) {
      console.error(err);
      setError("Erro ao criar lote de incubação");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-lg bg-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-widest border border-orange-200 shadow-sm">
              Gestão de Incubação
            </span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            Novo Lote
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
            Configuração técnica de início de ciclo
          </p>
        </div>
        <Button
          variant="outline"
          className="rounded-xl font-black text-[10px] uppercase tracking-widest px-6 py-4 hover:bg-orange-50 transition-all border-orange-100 text-orange-600"
          onClick={() => window.history.back()}
        >
          ⬅ Cancelar Operação
        </Button>
      </div>

      <Card className="border-none shadow-2xl shadow-orange-100/30 overflow-hidden rounded-[2.5rem] bg-white group animate-in slide-in-from-bottom-4 duration-500">
        <div className="h-3 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 shadow-md" />
        <CardHeader className="p-10 pb-4">
          <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Parâmetros de Entrada</CardTitle>
          <CardDescription className="text-xs font-bold text-orange-600 uppercase tracking-widest mt-1">Defina as especificações estruturais do lote</CardDescription>
        </CardHeader>
        <CardContent className="p-10 pt-4">
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-100 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest animate-pulse">
                ⚠️ {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-orange-600/50 uppercase tracking-widest px-1">Identificador de Lote</label>
                <Input
                  name="batchNumber"
                  value={formData.batchNumber}
                  onChange={handleChange}
                  disabled={true}
                  className="rounded-2xl py-7 bg-orange-50/30 border-orange-100/50 font-black text-sm text-gray-500 tracking-wider shadow-inner"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-orange-600/50 uppercase tracking-widest px-1">Quantidade de Ovos</label>
                <Input
                  type="number"
                  name="eggQuantity"
                  value={formData.eggQuantity}
                  onChange={handleChange}
                  placeholder="0"
                  disabled={isCreating}
                  className="rounded-2xl py-7 font-black text-sm tabular-nums border-orange-100/50 focus:ring-orange-500"
                />
              </div>

              <div className="col-span-1 md:col-span-2 space-y-4 bg-orange-50/20 p-8 rounded-[2rem] border border-orange-100/30">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-[10px] font-black text-orange-600/50 uppercase tracking-[0.2em] px-1">Origem do Insumo</h3>
                  {formData.eggSource === 'warehouse' && (
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${getFertileEggsStock() > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {getFertileEggsStock()} Férteis em Estoque
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className={`flex items-center gap-4 p-5 rounded-2xl cursor-pointer transition-all border-2 ${formData.eggSource === 'warehouse' ? 'bg-white border-orange-500 shadow-xl' : 'bg-transparent border-orange-100/30 opacity-60 hover:opacity-100'}`}>
                    <input
                      type="radio"
                      name="eggSource"
                      value="warehouse"
                      checked={formData.eggSource === 'warehouse'}
                      onChange={handleChange}
                      className="w-5 h-5 text-orange-600 border-orange-200 focus:ring-orange-500"
                    />
                    <div>
                      <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Armazém Interno</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">Dedução automática de estoque</p>
                    </div>
                  </label>

                  <label className={`flex items-center gap-4 p-5 rounded-2xl cursor-pointer transition-all border-2 ${formData.eggSource === 'other' ? 'bg-white border-orange-500 shadow-xl' : 'bg-transparent border-orange-100/30 opacity-60 hover:opacity-100'}`}>
                    <input
                      type="radio"
                      name="eggSource"
                      value="other"
                      checked={formData.eggSource === 'other'}
                      onChange={handleChange}
                      className="w-5 h-5 text-orange-600 border-orange-200 focus:ring-orange-500"
                    />
                    <div>
                      <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Procedência Externa</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">Apenas registro de rastreabilidade</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-orange-600/50 uppercase tracking-widest px-1">Arranque (Data Início)</label>
                <Input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  disabled={isCreating}
                  className="rounded-2xl py-7 font-black text-sm border-orange-100/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-orange-600/50 uppercase tracking-widest px-1">Previsão de Eclosão</label>
                <Input
                  type="date"
                  name="expectedHatchDate"
                  value={formData.expectedHatchDate}
                  onChange={handleChange}
                  disabled={isCreating}
                  className="rounded-2xl py-7 font-black text-sm border-orange-100/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-orange-600/50 uppercase tracking-widest px-1">Temperatura Alvo (°C)</label>
                <Input
                  type="number"
                  step="0.1"
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleChange}
                  disabled={isCreating}
                  className="rounded-2xl py-7 font-black text-sm tabular-nums border-orange-100/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-orange-600/50 uppercase tracking-widest px-1">Umidade Alvo (%)</label>
                <Input
                  type="number"
                  name="humidity"
                  value={formData.humidity}
                  onChange={handleChange}
                  disabled={isCreating}
                  className="rounded-2xl py-7 font-black text-sm tabular-nums border-orange-100/50"
                />
              </div>

              <div className="col-span-1 md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-orange-600/50 uppercase tracking-widest px-1">Linhagem / Espécie</label>
                <select
                  name="species"
                  value={formData.species}
                  onChange={handleChange as any}
                  disabled={isCreating}
                  className="w-full px-5 py-4 rounded-2xl border-2 border-orange-100/50 bg-white font-black text-xs uppercase tracking-widest focus:ring-2 focus:ring-orange-500 outline-none transition-all disabled:opacity-50"
                >
                  <option value="">Selecione...</option>
                  <option value="Codornas Japonesas">Codornas Japonesas</option>
                  <option value="Codornas Gigantes">Codornas Gigantes</option>
                  <option value="Codornas Chinesas">Codornas Chinesas</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-orange-600/50 uppercase tracking-widest px-1">Notas Suplementares</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Observações críticas sobre as matrizes ou ambiente..."
                disabled={isCreating}
                className="w-full px-6 py-5 rounded-[2rem] border-2 border-orange-100/50 bg-white text-sm font-medium focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder:text-gray-300 min-h-[140px]"
              />
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                variant="primary"
                className="flex-1 rounded-2xl py-7 font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-orange-200"
                isLoading={isCreating}
              >
                Iniciar Ciclo 🚀
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* DEBUG SECTION - Updated for Modern Theme */}
      <div className="mt-12 bg-white rounded-[2rem] border-none shadow-xl shadow-orange-100/20 overflow-hidden">
        <div className="px-8 py-6 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rastro de Inventário ({inventory.length} registros)</h4>
          <span className="text-[9px] font-bold text-orange-600/50 uppercase bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100">Auditoria Modo Dev</span>
        </div>
        <div className="p-4 overflow-auto max-h-80">
          <table className="w-full text-left">
            <thead className="bg-orange-50/30">
              <tr>
                <th className="p-4 text-[9px] font-black text-orange-900/40 uppercase tracking-widest">Subtipo</th>
                <th className="p-4 text-[9px] font-black text-orange-900/40 uppercase tracking-widest">Saldo</th>
                <th className="p-4 text-[9px] font-black text-orange-900/40 uppercase tracking-widest">Status</th>
                <th className="p-4 text-[9px] font-black text-orange-900/40 uppercase tracking-widest">Categoria</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {inventory.slice(0, 50).map(item => (
                <tr key={item.id} className="hover:bg-orange-50/20 transition-colors">
                  <td className="p-4 text-[10px] font-bold text-gray-700 uppercase tracking-tighter">{item.subtype}</td>
                  <td className="p-4 text-[10px] font-black text-orange-600 tabular-nums">{item.quantity}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${item.status === 'in_stock' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{item.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
