import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Loading from "@/components/ui/Loading";
import { useBatchById, useBatches } from "@/hooks/useBatches";
import { toast } from "sonner";

export default function GroupEdit() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/batches/:id/edit");
  const groupId = params?.id || "";

  const { batch: group, isLoading: groupLoading } = useBatchById(groupId);
  const { update, isUpdating } = useBatches();

  const [formData, setFormData] = useState({
    name: "",
    species: "",
    quantity: "",
    males: "0",
    females: "0",
    birthDate: "",
    location: "",
    status: "active" as "active" | "inactive" | "sold",
    notes: "",
    meta_mortalidade: "3.0",
    meta_producao_diaria: "0",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name,
        species: group.species,
        quantity: group.quantity.toString(),
        males: (group.males || 0).toString(),
        females: (group.females || 0).toString(),
        birthDate: group.birthDate || "",
        location: group.location || "",
        status: group.status,
        notes: group.notes || "",
        meta_mortalidade: group.meta_mortalidade?.toString() || "3.0",
        meta_producao_diaria: group.meta_producao_diaria?.toString() || "0",
      });
    }
  }, [group]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.species || !formData.quantity || !formData.birthDate) {
      setError("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    try {
      await update({
        id: groupId,
        data: {
          name: formData.name,
          species: formData.species,
          quantity: parseInt(formData.quantity),
          males: parseInt(formData.males),
          females: parseInt(formData.females),
          birthDate: formData.birthDate,
          status: formData.status,
          notes: formData.notes,
          meta_mortalidade: parseFloat(formData.meta_mortalidade),
          meta_producao_diaria: parseInt(formData.meta_producao_diaria),
        },
      });
      toast.success("Grupo atualizado com sucesso!");
      setLocation(`/batches/${groupId}`);
    } catch (err) {
      setError("Erro ao atualizar grupo");
      toast.error("Falha ao salvar alterações");
    }
  };

  if (groupLoading) {
    return <Loading fullScreen message="Carregando grupo..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Editar Grupo</h1>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1 italic">
          Ajuste as configurações e metas deste lote
        </p>
      </div>

      <Card className="bg-white border-none shadow-2xl shadow-gray-100 rounded-[32px] overflow-hidden">
        <CardHeader className="p-8 pb-0">
          <CardTitle className="text-lg font-black text-gray-900 uppercase tracking-widest">Informações Gerais</CardTitle>
          <CardDescription className="text-xs font-bold text-gray-400 uppercase tracking-widest italic">
            DADOS DE ORIGEM E PERFORMANCE
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-black uppercase tracking-widest">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Input
                label="Nome do Lote"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={isUpdating}
                className="h-12 bg-gray-50/50 border-gray-100 font-bold"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Quantidade Total"
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  disabled={isUpdating}
                />
                <Input
                  label="Linhagem/Espécie"
                  name="species"
                  value={formData.species}
                  onChange={handleChange}
                  required
                  disabled={isUpdating}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Quantidade Machos"
                  name="males"
                  type="number"
                  value={formData.males}
                  onChange={handleChange}
                  disabled={isUpdating}
                />
                <Input
                  label="Quantidade Fêmeas"
                  name="females"
                  type="number"
                  value={formData.females}
                  onChange={handleChange}
                  disabled={isUpdating}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data de Nascimento</label>
                <Input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                  disabled={isUpdating}
                  className="h-12 bg-gray-50/50 border-gray-100 font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status do Lote</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={isUpdating}
                  className="w-full h-12 px-4 rounded-2xl border-2 border-gray-100 bg-gray-50/50 text-gray-700 font-black text-xs uppercase tracking-widest outline-none focus:border-blue-500 transition-all"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="sold">Vendido</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 group flex items-center gap-1">
                  Meta Mortalidade (%) <span className="text-blue-500 italic">(Recomendado: 3%)</span>
                </label>
                <Input
                  type="number"
                  step="0.1"
                  name="meta_mortalidade"
                  value={formData.meta_mortalidade}
                  onChange={handleChange}
                  disabled={isUpdating}
                  className="h-12 bg-gray-50/50 border-gray-100 font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Meta Produção Diária (Ovos)</label>
                <Input
                  type="number"
                  name="meta_producao_diaria"
                  value={formData.meta_producao_diaria}
                  onChange={handleChange}
                  disabled={isUpdating}
                  className="h-12 bg-gray-50/50 border-gray-100 font-bold"
                />
              </div>

              <div className="space-y-2 opacity-50">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Localização Atual</label>
                <Input
                  value={formData.location}
                  disabled
                  className="h-12 bg-gray-50 border-gray-100 font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Notas e Observações</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                disabled={isUpdating}
                className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50/50 text-gray-700 font-medium text-sm outline-none focus:border-blue-500 transition-all"
                rows={4}
              />
            </div>

            <div className="flex flex-col md:flex-row gap-4 pt-6">
              <Button
                type="submit"
                className="flex-1 py-8 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-100"
                isLoading={isUpdating}
              >
                Salvar Alterações
              </Button>
              <Button
                type="button"
                variant="outline"
                className="md:w-48 py-8 rounded-2xl font-black text-xs uppercase tracking-widest border-2"
                onClick={() => setLocation(`/batches/${groupId}`)}
                disabled={isUpdating}
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
