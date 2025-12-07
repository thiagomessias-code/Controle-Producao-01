import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Loading from "@/components/ui/Loading";
import QRCodeScanner from "@/components/ui/QRCodeScanner";
import { useFeed } from "@/hooks/useFeed";
import { useGroups } from "@/hooks/useGroups";
import { useCages } from "@/hooks/useCages";
import { useBatches } from "@/hooks/useBatches";
import { useAppStore } from "@/hooks/useAppStore";
import { formatDate } from "@/utils/date";
import { formatQuantity } from "@/utils/format";
import { computeFeedType } from "@/utils/feed";

export default function FeedUsage() {
  const [location, setLocation] = useLocation();
  const { groups } = useGroups();
  const { cages } = useCages();
  const { batches } = useBatches();
  const { feeds, isLoading, isCreating, isDeleting, create, delete: deleteFeed } = useFeed();
  const { pendingTasks, removePendingTask } = useAppStore();

  const [showForm, setShowForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isGrowthBox, setIsGrowthBox] = useState(false);
  const [extendFeed, setExtendFeed] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    groupId: "",
    cageId: "",
    date: new Date().toISOString().split("T")[0],
    quantity: "0.24",
    type: "Ração Postura",
    supplier: "Fornecedor Padrão",
    notes: "",
  });

  // Auto-fill feed type based on selection
  useEffect(() => {
    if (!formData.groupId && !formData.cageId) return;

    let computedType = "Ração Postura";
    let birthDate: string | undefined;
    let groupType: string | undefined;

    if (isGrowthBox) {
      const batch = batches.find(b => b.id === formData.groupId);
      if (batch) birthDate = batch.birthDate;
      groupType = "Crescimento";
    } else {
      const batch = batches.find(b => b.cageId === formData.cageId && b.status === 'active');
      const group = groups.find(g => g.id === formData.groupId);

      if (batch) birthDate = batch.birthDate;
      if (group) groupType = group.type;
    }

    computedType = computeFeedType(groupType, birthDate, extendFeed, formData.type);

    setFormData(prev => ({
      ...prev,
      quantity: "0.24",
      type: computedType,
      supplier: "Fornecedor Padrão",
    }));
  }, [formData.groupId, formData.cageId, isGrowthBox, extendFeed, groups, batches]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleQRCodeScan = (data: string) => {
    try {
      const scannedData = JSON.parse(data);
      setFormData(prev => ({
        ...prev,
        groupId: scannedData.groupId || prev.groupId,
        cageId: scannedData.cageId || prev.cageId,
      }));
      setShowScanner(false);
      setShowForm(true);
    } catch {
      setError("QR Code inválido");
    }
  };

  const handleToggleGrowth = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsGrowthBox(e.target.checked);
    setFormData(prev => ({ ...prev, groupId: "", cageId: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.groupId || !formData.date || !formData.quantity || !formData.type) {
      setError("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    try {
      await create({
        groupId: formData.groupId,
        cageId: formData.cageId,
        date: formData.date,
        quantity: parseFloat(formData.quantity),
        type: formData.type,
        cost: 0,
        supplier: formData.supplier,
        notes: formData.notes,
      });

      // Remove pending tasks
      const relatedTask = pendingTasks.find(task =>
        task.actionUrl.includes(formData.groupId) && task.actionUrl.includes('feed')
      );
      if (relatedTask) removePendingTask(relatedTask.id);

      setFormData({
        groupId: "",
        cageId: "",
        date: new Date().toISOString().split("T")[0],
        quantity: "0.24",
        type: "Ração Postura",
        supplier: "Fornecedor Padrão",
        notes: "",
      });
      setShowForm(false);
      setExtendFeed(false);
    } catch {
      setError("Erro ao registrar alimentação");
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja deletar este registro?")) deleteFeed(id);
  };

  if (isLoading) return <Loading fullScreen message="Carregando alimentação..." />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Alimentação</h1>
          <p className="text-muted-foreground mt-1">Gerencie o uso de ração dos seus grupos</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setShowForm(!showForm);
            if (!showForm) setShowScanner(true);
          }}
        >
          {showForm ? "Cancelar" : "+ Novo Registro"}
        </Button>
      </div>

      {showForm && (
        <>
          {showScanner && <QRCodeScanner onScan={handleQRCodeScan} onClose={() => setShowScanner(false)} title="Escanear QR Code" />}
          
          <Card>
            <CardHeader>
              <CardTitle>Registro de Alimentação</CardTitle>
              <CardDescription>Confirme os dados e selecione o horário</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>}

                <div className="flex items-center gap-2 mb-4 p-4 bg-muted/30 rounded-lg border border-dashed">
                  <input type="checkbox" id="growthBox" checked={isGrowthBox} onChange={handleToggleGrowth} className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
                  <label htmlFor="growthBox" className="text-sm font-medium text-foreground cursor-pointer select-none">
                    Alimentação Caixa de Crescimento (Lotes)
                  </label>
                </div>

                {!isGrowthBox ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Grupo */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Grupo *</label>
                      <select
                        name="groupId"
                        value={formData.groupId}
                        onChange={handleChange}
                        disabled={isCreating}
                        className="w-full px-4 py-2 rounded-lg border-2 border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
                      >
                        <option value="">Selecione um grupo</option>
                        {groups.filter(g => g.status === "active").map(group => (
                          <option key={group.id} value={group.id}>
                            {group.name} - {group.location} ({group.species})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Gaiola */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Gaiola *</label>
                      <select
                        name="cageId"
                        value={formData.cageId}
                        onChange={handleChange}
                        disabled={isCreating || !formData.groupId}
                        className="w-full px-4 py-2 rounded-lg border-2 border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
                      >
                        <option value="">Selecione uma gaiola</option>
                        {cages.filter(c => c.groupId === formData.groupId && c.status === 'active').map(cage => (
                          <option key={cage.id} value={cage.id}>
                            {cage.name} ({cage.currentQuantity}/{cage.capacity})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Lote de Crescimento *</label>
                    <select
                      name="groupId"
                      value={formData.groupId}
                      onChange={handleChange}
                      disabled={isCreating}
                      className="w-full px-4 py-2 rounded-lg border-2 border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
                    >
                      <option value="">Selecione um lote</option>
                      {batches
                        .filter(batch => batch.status === "active" && batch.growthBoxId === formData.groupId)
                        .map(batch => (
                          <option key={batch.id} value={batch.id}>
                            {batch.name} - {batch.location || "Sem local"} ({batch.quantity} aves)
                          </option>
                        ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">Selecione o lote ativo na caixa de crescimento.</p>
                  </div>
                )}

                {/* Quantidade e tipo de ração */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Quantidade (kg) - Fixo</label>
                    <input type="text" value="0.24 kg (240g)" readOnly disabled className="w-full px-4 py-2 rounded-lg border-2 border-input bg-muted text-muted-foreground cursor-not-allowed" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Tipo de Ração (Automático)</label>
                    <input type="text" value={formData.type} readOnly disabled className="w-full px-4 py-2 rounded-lg border-2 border-input bg-muted text-muted-foreground cursor-not-allowed" />
                  </div>

                  <Input label="Fornecedor" name="supplier" value={formData.supplier} onChange={handleChange} placeholder="Ex: Fornecedor X" disabled={isCreating} />
                </div>

                {/* Estender ração */}
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border border-dashed">
                  <input type="checkbox" id="extendFeed" checked={extendFeed} onChange={e => setExtendFeed(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
                  <label htmlFor="extendFeed" className="text-sm font-medium text-foreground cursor-pointer select-none">🔄 Estender Ração Atual</label>
                </div>

                {/* Horários */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Horário da Alimentação *</label>
                  <div className="flex gap-4">
                    {["07:00", "13:00", "17:00"].map(time => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, notes: `Horário: ${time}` }))}
                        className={`flex-1 py-3 rounded-lg border-2 font-medium transition-all ${formData.notes.includes(time) ? "border-primary bg-primary/10 text-primary" : "border-input hover:border-primary/50 text-muted-foreground"}`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Selecione o horário para confirmar a tarefa.</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" variant="primary" className="w-full py-6 text-lg" isLoading={isCreating} disabled={!formData.notes.includes(":")}>
                    ✅ Confirmar Alimentação
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </>
      )}

      {feeds.length === 0 ? (
        <EmptyState
          icon="🌾"
          title="Nenhum registro de alimentação"
          description="Comece registrando o uso de ração dos seus grupos"
          action={<Button variant="primary" onClick={() => { setShowForm(true); setShowScanner(true); }}>Registrar Alimentação</Button>}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold text-foreground">Data</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Quantidade</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Tipo</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Fornecedor</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {feeds.map(feed => (
                <tr key={feed.id} className="border-b border-border hover:bg-muted/50">
                  <td className="py-3 px-4">{formatDate(feed.date)}</td>
                  <td className="py-3 px-4">{formatQuantity(feed.quantity)} kg</td>
                  <td className="py-3 px-4">{feed.type}</td>
                  <td className="py-3 px-4">{feed.supplier || "-"}</td>
                  <td className="py-3 px-4">
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(feed.id)} isLoading={isDeleting}>Deletar</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
