import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Trash2 } from "lucide-react";
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
import { formatDate, formatDateTime, getLocalISODate } from "@/utils/date";
import { formatQuantity } from "@/utils/format";
import { feedApi, FeedType, FeedConfiguration } from "@/api/feed";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { caixasApi, GrowthBox } from "@/api/caixas";
import { toast } from "sonner";
import { parseQRData } from "@/utils/qr";
import { FeedSilo } from "@/components/ui/FeedSilo";

export default function FeedUsage() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const { groups } = useGroups();
  const { cages } = useCages();
  const { batches } = useBatches();
  const { feeds, isLoading, isCreating, isDeleting, create, delete: deleteFeed } = useFeed();
  const { pendingTasks, removePendingTask } = useAppStore();

  const [showForm, setShowForm] = useState(false);
  const [showScanner, setShowScanner] = useState(true);
  const [isGrowthBox, setIsGrowthBox] = useState(false);
  // Extend feed logic removed/deprecated in favor of strict config, but keeping flag if needed for manual override? 
  // User asked for structural enforcement. Ill remove "Extend" to simplify.

  const [error, setError] = useState("");

  // Dynamic Data State
  const [availableFeeds, setAvailableFeeds] = useState<FeedType[]>([]);
  const [configurations, setConfigurations] = useState<FeedConfiguration[]>([]);
  const [growthBoxes, setGrowthBoxes] = useState<GrowthBox[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Active Configuration based on selection
  const [activeConfig, setActiveConfig] = useState<FeedConfiguration | null>(null);

  const [formData, setFormData] = useState({
    groupId: "",
    cageId: "",
    batchId: "",
    date: new Date().toISOString().split("T")[0],
    quantity: "0.24", // Will be overwritten by config
    feedTypeId: "",
    feedTypeName: "",
    supplier: "Fornecedor Padrão",
    notes: "",
    scheduledTime: "",
    executedAt: ""
  });

  // State for filtering "Production Mode" cages
  const [selectedGroupType, setSelectedGroupType] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qBatchId = params.get("batchId");
    const qGroupId = params.get("groupId");

    if (qBatchId && batches.length > 0) {
      const batch = batches.find(b => b.id === qBatchId);
      if (batch) {
        setIsGrowthBox(true);
        setShowForm(true);
        setFormData(prev => ({
          ...prev,
          batchId: batch.id,
          cageId: batch.cageId || "",
          groupId: batch.galpao_id || ""
        }));
      }
    } else if (qGroupId && groups.length > 0) {
      const group = groups.find(g => g.id === qGroupId);
      if (group) {
        setShowForm(true);
        setFormData(prev => ({ ...prev, groupId: group.id }));
        // Infer group type for filtering
        const type = group.type?.toLowerCase();
        if (type?.includes('prod') || type?.includes('postura')) setSelectedGroupType('produtoras');
        else if (type?.includes('macho')) setSelectedGroupType('machos');
        else if (type?.includes('reprod')) setSelectedGroupType('reprodutoras');
      }
    }
  }, [batches, groups]);

  useEffect(() => {
    console.log("DEBUG: groups", groups);
    console.log("DEBUG: cages", cages);

    if (groups.length > 0 && cages.length > 0) {
      console.log("DEBUG: Sample Filter Check ('produtoras'):", cages.filter(c => {
        const parentGroup = groups.find(g => g.id === c.groupId);
        if (!parentGroup) return false;
        return parentGroup.type === 'postura' || parentGroup.type === 'production';
      }).length);
    }
  }, [groups, cages]);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const [types, configs, boxes] = await Promise.all([
          feedApi.getFeedTypes(),
          feedApi.getConfigurations(),
          caixasApi.getAll()
        ]);
        setAvailableFeeds(types);
        setConfigurations(configs);
        setGrowthBoxes(boxes);
      } catch (e) {
        console.error("Error loading feed config", e);
      } finally {
        setLoadingConfig(false);
      }
    };
    loadConfig();
  }, []);

  // Determine Active Config & Auto-fill
  useEffect(() => {
    // Map selection ID to Config Type
    let type = selectedGroupType || '';

    if (selectedGroupType) {
      if (selectedGroupType === 'produtoras') type = 'production';
      else if (selectedGroupType === 'machos') type = 'males';
      else if (selectedGroupType === 'reprodutoras') type = 'breeders';
    }

    // If a cage is selected, use its group's type
    if (isGrowthBox && formData.cageId) {
      // For growth boxes, the type is always 'crescimento'
      type = 'crescimento';
    } else if (formData.cageId) {
      const cage = cages.find(c => String(c.id) === String(formData.cageId));
      if (cage) {
        const group = groups.find(g => String(g.id) === String(cage.groupId));
        if (group && group.type) {
          console.log("FEED AUTOFILL DEBUG: Cage parent group type before normalization:", group.type);
          // Normalized type mapping (must match AdminFeed.tsx keys)
          let normalizedType = group.type.toLowerCase();
          if (normalizedType.includes('prod') || normalizedType.includes('postura')) normalizedType = 'production';
          else if (normalizedType.includes('macho')) normalizedType = 'males';
          else if (normalizedType.includes('reprod')) normalizedType = 'breeders';
          else if (normalizedType.includes('cresci')) normalizedType = 'crescimento';
          type = normalizedType;
        } else if (group) {
          // Fallback to group name if type is missing? 
          const groupName = group.name.toLowerCase();
          if (groupName.includes('prod') || groupName.includes('postura')) type = 'production';
          else if (groupName.includes('macho')) type = 'males';
          else if (groupName.includes('reprod')) type = 'breeders';
          else if (groupName.includes('cresci')) type = 'crescimento';
        }
      }
    }

    console.log("DEBUG: Final Type selected for config:", type);
    console.log("DEBUG: Available configs dump:", JSON.stringify(configurations));

    // Find config (FUZZY MATCHING)
    const targetType = (type || '').toLowerCase().trim();
    console.log("DEBUG: Config search - targetType:", `"${targetType}"`);

    let config = configurations.find(c => {
      const dbType = (c.group_type || '').toLowerCase().trim();
      const match = dbType === targetType ||
        (targetType === 'production' && dbType === 'postura') ||
        (targetType === 'males' && (dbType === 'machos' || dbType === 'macho')) ||
        (targetType === 'breeders' && (dbType === 'reprodutoras' || dbType === 'matrizes'));

      if (match) console.log(`DEBUG: Config found match! dbType: "${dbType}" targetType: "${targetType}"`);
      return match;
    });

    // Fallback for crescimento
    if (!config && type === 'crescimento') {
      config = configurations.find(c =>
        c.group_type?.toLowerCase().includes('cresci') ||
        c.group_type?.toLowerCase().includes('inicial') ||
        c.group_type?.toLowerCase().includes('growth')
      );
    }

    // FINAL FALLBACK: If still no config but it's a growth box, provide a virtual one
    // to prevent the user from being stuck (as requested: "raçao predefinida", "horarios")
    if (!config && isGrowthBox) {
      console.log("DEBUG: Using virtual fallback config for Growth Box");
      // Pick a reasonable feed type from available ones
      const fallbackFeedType = availableFeeds.find(f =>
        f.phase === 'crescimento' ||
        f.name.toLowerCase().includes('cresci') ||
        f.name.toLowerCase().includes('inicial')
      ) || availableFeeds[0];

      config = {
        id: 'virtual-growth',
        group_type: 'crescimento',
        feed_type_id: fallbackFeedType?.id || '',
        quantity_per_cage: 0.240,
        schedule_times: ["07:00", "11:00", "15:00"],
        active: true
      };
    }

    console.log("DEBUG: Config found:", config);
    setActiveConfig(config || null);

    if (config) {
      // Enforce Config
      const feedType = availableFeeds.find(f => f.id === config.feed_type_id);

      // Auto-select nearest time
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeVal = currentHour * 60 + currentMinute;

      let closestTime = "";
      let minDiff = Infinity;

      if (config.schedule_times && Array.isArray(config.schedule_times)) {
        config.schedule_times.forEach(t => {
          if (!t) return;
          const [h, m] = t.split(':').map(Number);
          const timeVal = h * 60 + m;
          const diff = Math.abs(timeVal - currentTimeVal);
          if (diff < minDiff) {
            minDiff = diff;
            closestTime = t;
          }
        });
      }

      const note = closestTime ? `Horário: ${closestTime}` : "";

      setFormData(prev => {
        const newFeedTypeId = config.feed_type_id || prev.feedTypeId;
        const newQuantity = config.quantity_per_cage ? config.quantity_per_cage.toString() : prev.quantity;
        const newScheduledTime = closestTime || prev.scheduledTime;

        // Only update if IDs significantly changed to prevent infinite loops or overwriting notes
        if (prev.feedTypeId === newFeedTypeId && prev.scheduledTime === newScheduledTime && prev.quantity === newQuantity && prev.batchId === (prev.batchId || "")) {
          return prev;
        }

        return {
          ...prev,
          feedTypeId: newFeedTypeId,
          feedTypeName: feedType?.name || prev.feedTypeName || 'Ração Configurada',
          quantity: newQuantity,
          supplier: feedType?.supplier_default || prev.supplier,
          notes: closestTime ? note : prev.notes,
          scheduledTime: newScheduledTime
        };
      });
    }

  }, [selectedGroupType, formData.cageId, configurations, availableFeeds, cages, groups, isGrowthBox, growthBoxes]);


  // Auto-detect batch for Production Mode (Cage selected)
  useEffect(() => {
    if (!isGrowthBox && formData.cageId) {
      const activeBatch = batches.find(b => String(b.cageId) === String(formData.cageId) && b.status === "active");
      console.log("FEED AUTOFILL DEBUG: Auto-detect batch for cage:", formData.cageId, "Found batch:", activeBatch?.id);
      if (activeBatch) {
        setFormData(prev => ({ ...prev, batchId: activeBatch.id }));
      } else {
        setFormData(prev => ({ ...prev, batchId: "" }));
      }
    }
  }, [isGrowthBox, formData.cageId, batches]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleQRCodeScan = (data: string) => {
    try {
      const { id, type } = parseQRData(data);
      console.log("FEED SCAN DEBUG: Resolved from utility:", { id, type });

      let cageId = "";
      let groupId = "";
      let isBox = false;

      // Try as Box first if type is caixa
      if (type === 'caixa') {
        const box = growthBoxes.find(b => String(b.id) === String(id));
        if (box) {
          cageId = box.id;
          groupId = box.aviaryId || "";
          isBox = true;
        }
      }

      // If not found or type is gaiola/unknown, try as cage
      if (!cageId) {
        const cage = cages.find(c => String(c.id) === String(id));
        if (cage) {
          cageId = cage.id;
          groupId = cage.groupId;
          isBox = false;
        } else if (!type) {
          // If unknown type and not a cage, maybe it's still a box without a prefix
          const box = growthBoxes.find(b => String(b.id) === String(id));
          if (box) {
            cageId = box.id;
            groupId = box.aviaryId || "";
            isBox = true;
          }
        }
      }

      console.log("FEED SCAN DEBUG: Final Resolution:", { cageId, groupId, isBox });

      if (groupId || cageId) {
        setIsGrowthBox(isBox);

        // Infer group type for filtering
        if (!isBox && groupId) {
          const group = groups.find(g => String(g.id) === String(groupId));
          if (group) {
            const t = (group.type || '').toLowerCase();
            if (t.includes('prod') || t.includes('postura')) setSelectedGroupType('produtoras');
            else if (t.includes('macho')) setSelectedGroupType('machos');
            else if (t.includes('reprod')) setSelectedGroupType('reprodutoras');
            else if (t.includes('cresci')) setSelectedGroupType('crescimento');
          }
        } else if (isBox) {
          setSelectedGroupType("");
        }

        setFormData(prev => ({
          ...prev,
          groupId: groupId || prev.groupId,
          cageId: cageId || prev.cageId,
        }));

        setShowScanner(false);
        setShowForm(true);
        toast.success(isBox ? "Caixa identificada!" : "Gaiola identificada!");
      } else {
        toast.error("ID não encontrado no sistema");
      }
    } catch (e) {
      toast.error("Erro ao processar QR Code");
    }
  };

  const handleToggleGrowth = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, groupId: "", cageId: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("DEBUG: handleSubmit - Final FormData payload:", formData);
    console.log("DEBUG: handleSubmit - Context:", { isGrowthBox, user: user?.id });

    if (!formData.batchId) console.log("DEBUG: handleSubmit - WARNING: batchId is empty");
    if (!formData.date) console.log("DEBUG: handleSubmit - ERROR: date is missing");
    if (!formData.quantity) console.log("DEBUG: handleSubmit - ERROR: quantity is missing");
    if (!formData.feedTypeId) console.log("DEBUG: handleSubmit - ERROR: feedTypeId is missing");

    // Validation Logic
    const isBatchRequired = isGrowthBox;
    const isCageRequired = !isGrowthBox;

    if (
      (isBatchRequired && !formData.batchId) ||
      (isCageRequired && !formData.cageId) ||
      !formData.groupId ||
      !formData.date ||
      !formData.quantity ||
      !formData.feedTypeId
    ) {
      console.log("Validation Failed:", { isBatchRequired, isCageRequired, formData });
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    try {
      // Check if selected date is today (locally)
      const localToday = getLocalISODate();

      const finalDate = formData.date === localToday
        ? new Date().toISOString()
        : `${formData.date}T12:00:00`;

      await create({
        groupId: formData.groupId,
        cageId: formData.cageId,
        batchId: formData.batchId,
        date: finalDate,
        quantity: parseFloat(formData.quantity),
        feedTypeId: formData.feedTypeId,
        feedTypeName: formData.feedTypeName,
        supplier: formData.supplier,
        notes: `${formData.notes} (Registrado por ${user?.name || 'Sistema'})`,
      });

      // Cleanup
      const relatedTask = pendingTasks.find(task =>
        task.actionUrl.includes(formData.groupId) && task.actionUrl.includes('feed')
      );
      if (relatedTask) removePendingTask(relatedTask.id);

      setFormData(prev => ({ ...prev, batchId: "", notes: "" }));
      setShowForm(false);
    } catch {
      setError("Erro ao registrar alimentação");
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja deletar este registro?")) deleteFeed(id);
  };

  if (isLoading) return <Loading fullScreen message="Carregando alimentação..." />;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100/50">
            Nutrição & Manejo
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Alimentação Coletiva</h1>
          <p className="text-gray-500 font-medium text-lg leading-relaxed">
            Gestão inteligente de <span className="text-orange-600 font-bold">trato e nutrição animal</span>.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="rounded-xl border-orange-100 text-orange-600 hover:bg-orange-50 font-bold"
          >
            ⬅️ Voltar
          </Button>
          <Button
            variant={showForm ? "outline" : "primary"}
            className={`rounded-xl font-black shadow-lg ${showForm ? 'border-orange-100 text-orange-600 hover:bg-orange-50' : 'shadow-orange-200'}`}
            onClick={() => {
              if (showForm || showScanner) {
                setShowForm(false);
                setShowScanner(false);
              } else {
                setShowScanner(true);
              }
              if (!showForm && !showScanner) {
                setFormData({
                  groupId: "",
                  cageId: "",
                  date: new Date().toISOString().split("T")[0],
                  quantity: "",
                  notes: "",
                  feedTypeId: "",
                  scheduledTime: "",
                  batchId: "",
                  feedTypeName: "",
                  supplier: "Fornecedor Padrão",
                  executedAt: ""
                });
                setSelectedGroupType("");
              }
            }}
          >
            {(showForm || showScanner) ? "CANCELAR" : "+ NOVO REGISTRO"}
          </Button>
        </div>
      </div>

      {/* Feed Stock Silos */}
      {!showScanner && !showForm && availableFeeds.length > 0 && (
        <div className="flex flex-wrap gap-4 overflow-x-auto pb-4 justify-center md:justify-start">
          {availableFeeds.map(feed => (
            <FeedSilo
              key={feed.id}
              name={feed.name}
              current={feed.estoque_atual}
              max={5000}
              color={feed.name.toLowerCase().includes('postura') ? '#f59e0b' : '#3b82f6'}
            />
          ))}
        </div>
      )}

      {showScanner ? (
        <div className="animate-in fade-in zoom-in-95 duration-300">
          <QRCodeScanner
            onScan={handleQRCodeScan}
            onClose={() => setShowScanner(false)}
            onManualInput={() => {
              setShowScanner(false);
              setShowForm(true);
            }}
            title="Escanear QR Code"
          />
          <div className="mt-4 text-center">
            <Button variant="outline" onClick={() => { setShowScanner(false); setShowForm(true); }} className="rounded-xl border-orange-100 text-orange-600 font-bold px-8">
              Pular e Usar Registro Manual
            </Button>
          </div>
        </div>
      ) : showForm ? (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <Card className="border-none shadow-2xl shadow-orange-100/50 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-orange-400 to-orange-600"></div>
            <CardHeader className="p-8 pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                    Registro de Trato
                  </CardTitle>
                  <CardDescription className="text-xs font-bold text-orange-600 uppercase tracking-widest">
                    {activeConfig ? 'Configuração Automática Ativa' : 'Preenchimento Manual'}
                  </CardDescription>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setShowScanner(true)} className="rounded-lg font-black flex items-center gap-2">
                  <span className="text-lg">📱</span> RE-ESCANEAR
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <form onSubmit={handleSubmit} className="space-y-8">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-3 animate-pulse">
                    <span className="text-xl">⚠️</span> {error}
                  </div>
                )}

                <div className="flex items-center gap-3 p-5 bg-orange-50/50 rounded-[1.5rem] border border-orange-100/50 group cursor-pointer hover:bg-orange-50 transition-colors">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      id="growthBox"
                      checked={isGrowthBox}
                      onChange={handleToggleGrowth}
                      className="w-6 h-6 rounded-lg border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                  </div>
                  <label htmlFor="growthBox" className="text-sm font-black text-orange-900/60 uppercase tracking-widest cursor-pointer select-none">
                    HABILITAR MODO CAIXA DE CRESCIMENTO (RECRIA)
                  </label>
                </div>

                {!isGrowthBox ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Setor de Atuação</label>
                      <select
                        name="groupType"
                        value={selectedGroupType}
                        onChange={(e) => {
                          setSelectedGroupType(e.target.value);
                          setFormData(prev => ({ ...prev, groupId: "", cageId: "", batchId: "" }));
                        }}
                        disabled={isCreating}
                        className="w-full px-5 py-3.5 rounded-2xl border-none bg-orange-50/30 text-gray-900 font-bold focus:ring-2 focus:ring-orange-200 transition-all outline-none appearance-none"
                      >
                        <option value="">Selecione o tipo</option>
                        {[
                          { id: 'produtoras', name: 'Galinhas Poedeiras' },
                          { id: 'machos', name: 'Machos (Reprodução)' },
                          { id: 'reprodutoras', name: 'Matrizes (Reprodutoras)' }
                        ].filter(fixedGroup => {
                          return groups.some(g => {
                            if (g.status !== 'active') return false;
                            const t = (g.type || '').toLowerCase();
                            if (fixedGroup.id === 'produtoras') return t === 'production' || t === 'postura';
                            if (fixedGroup.id === 'machos') return t === 'males' || t === 'macho' || t === 'machos';
                            if (fixedGroup.id === 'reprodutoras') return t === 'breeders' || t === 'reprodutoras';
                            return false;
                          });
                        }).map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Unidade de Alojamento</label>
                      <select
                        name="cageId"
                        value={formData.cageId}
                        onChange={(e) => {
                          const cageId = e.target.value;
                          const cage = cages.find(c => c.id === cageId);
                          setFormData(prev => ({
                            ...prev,
                            cageId,
                            groupId: cage ? cage.groupId : (prev.groupId || "")
                          }));
                        }}
                        disabled={isCreating || !selectedGroupType}
                        className="w-full px-5 py-3.5 rounded-2xl border-none bg-orange-50/30 text-gray-900 font-bold focus:ring-2 focus:ring-orange-200 transition-all outline-none appearance-none disabled:opacity-30"
                      >
                        <option value="">Selecione uma gaiola</option>
                        {cages
                          .filter(c => {
                            if (!selectedGroupType) return false;
                            const parentGroup = groups.find(g => g.id === c.groupId);
                            if (!parentGroup || parentGroup.status !== 'active') return false;
                            const t = (parentGroup.type || '').toLowerCase();
                            if (selectedGroupType === 'produtoras') return t === 'postura' || t === 'production' || !t;
                            if (selectedGroupType === 'machos') return t === 'males' || t === 'machos' || t === 'macho';
                            if (selectedGroupType === 'reprodutoras') return t === 'breeders' || t === 'reprodutoras';
                            return false;
                          })
                          .map(cage => {
                            const parentGroup = groups.find(g => g.id === cage.groupId);
                            return (
                              <option key={cage.id} value={cage.id}>
                                {cage.name} - {parentGroup?.name || 'Galpão'} ({cage.currentQuantity}/{cage.capacity})
                              </option>
                            );
                          })}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Caixa de Destino</label>
                      <select
                        name="cageId"
                        value={formData.cageId}
                        onChange={(e) => {
                          const cageId = e.target.value;
                          const box = growthBoxes.find(b => b.id === cageId);
                          const cage = cages.find(c => c.id === cageId);
                          setFormData(prev => ({
                            ...prev,
                            cageId,
                            groupId: cage ? cage.groupId : (box ? box.aviaryId : ""),
                            batchId: ""
                          }));
                        }}
                        disabled={isCreating}
                        className="w-full px-5 py-3.5 rounded-2xl border-none bg-orange-50/30 text-gray-900 font-bold focus:ring-2 focus:ring-orange-200 transition-all outline-none appearance-none"
                      >
                        <option value="">Selecione a Caixa</option>
                        {growthBoxes.map(box => (
                          <option key={box.id} value={box.id}>📦 {box.name}</option>
                        ))}
                        {cages
                          .filter(c => {
                            const parentGroup = groups.find(g => g.id === c.groupId);
                            return parentGroup?.name?.toLowerCase().includes('crescimento') || parentGroup?.type === 'crescimento';
                          })
                          .map(cage => (
                            <option key={cage.id} value={cage.id}>🏠 {cage.name}</option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Lote Identificado</label>
                      <select
                        name="batchId"
                        value={formData.batchId}
                        onChange={handleChange}
                        disabled={isCreating || !formData.cageId}
                        className="w-full px-5 py-3.5 rounded-2xl border-none bg-orange-50/30 text-gray-900 font-bold focus:ring-2 focus:ring-orange-200 transition-all outline-none appearance-none disabled:opacity-30"
                      >
                        <option value="">Selecione um lote</option>
                        {batches
                          .filter(batch =>
                            batch.status === "active" &&
                            (batch.phase === "crescimento" || batch.phase === "caricoto" || batch.phase === "inicial" || batch.phase === "growth" || !batch.phase) &&
                            batch.cageId === formData.cageId
                          )
                          .map(batch => (
                            <option key={batch.id} value={batch.id}>
                              Lote {batch.name} ({batch.quantity} aves)
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-white rounded-[2rem] border border-orange-100/50 shadow-inner group">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Dose por Gaiola</label>
                    {activeConfig ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-gray-900 tabular-nums">{activeConfig.quantity_per_cage}</span>
                        <span className="text-sm font-bold text-gray-300 uppercase">KG</span>
                      </div>
                    ) : (
                      <Input
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        placeholder="0.000"
                        type="number"
                        step="0.001"
                        className="border-none bg-orange-50/30 font-black text-xl"
                      />
                    )}
                    <p className="text-[9px] font-bold text-orange-400 uppercase mt-2 tracking-widest">Peso Líquido Programado</p>
                  </div>

                  <div className="p-6 bg-white rounded-[2rem] border border-orange-100/50 shadow-inner">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Especificação de Ração</label>
                    {activeConfig ? (
                      <div className="text-lg font-black text-gray-900 group-hover:text-orange-600 transition-colors">{formData.feedTypeName}</div>
                    ) : (
                      <select
                        name="feedTypeId"
                        value={formData.feedTypeId}
                        onChange={(e) => {
                          const id = e.target.value;
                          const type = availableFeeds.find(f => f.id === id);
                          setFormData(prev => ({ ...prev, feedTypeId: id, feedTypeName: type?.name || '' }));
                        }}
                        className="w-full border-none bg-orange-50/30 font-bold rounded-xl p-2 outline-none"
                      >
                        <option value="">Selecione...</option>
                        {availableFeeds.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </select>
                    )}
                    <p className="text-[9px] font-bold text-gray-300 uppercase mt-2 tracking-widest">Fórmula Nutricional</p>
                  </div>

                  <div className="p-6 bg-white rounded-[2rem] border border-orange-100/50 shadow-inner">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Procedência</label>
                    <div className="text-lg font-black text-gray-900">{formData.supplier}</div>
                    <p className="text-[9px] font-bold text-gray-300 uppercase mt-2 tracking-widest">Fornecedor Logístico</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-xl font-black text-gray-900 uppercase tracking-tight">Seleção de Horário</label>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {(activeConfig && activeConfig.schedule_times && activeConfig.schedule_times.length > 0) ? (
                      activeConfig.schedule_times.map((time, idx) => {
                        const isSelected = formData.scheduledTime === time;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              const now = new Date();
                              const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                              setFormData(prev => ({
                                ...prev,
                                scheduledTime: time,
                                executedAt: now.toISOString(),
                                notes: `Horário Programado: ${time} | Executado: ${currentTimeStr}`
                              }));
                            }}
                            className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-1 ${isSelected
                              ? "border-orange-500 bg-orange-500 text-white shadow-xl shadow-orange-200 scale-105"
                              : "border-gray-100 bg-white hover:border-orange-200 text-gray-400"
                              }`}
                          >
                            <span className="text-2xl font-black tabular-nums">{time}</span>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-orange-100' : 'text-gray-300'}`}>CONFIRMAR</span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="col-span-full">
                        <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-4">Selecione o horário manual:</p>
                        <div className="flex flex-wrap gap-3">
                          {["07:00", "11:00", "15:00", "19:00"].map(time => (
                            <button
                              key={time}
                              type="button"
                              onClick={() => {
                                const now = new Date();
                                setFormData(prev => ({
                                  ...prev,
                                  scheduledTime: time,
                                  executedAt: now.toISOString(),
                                  notes: `Horário Manual: ${time}`
                                }));
                              }}
                              className={`px-6 py-3 rounded-xl border-2 font-black transition-all ${formData.scheduledTime === time ? "border-orange-500 bg-orange-50 text-orange-600" : "border-gray-100 text-gray-400"}`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-8 text-xl font-black rounded-[2rem] shadow-2xl shadow-orange-200"
                  isLoading={isCreating}
                  disabled={!formData.scheduledTime || !formData.feedTypeId}
                >
                  CONCLUIR E REGISTRAR ({formData.scheduledTime || '--:--'})
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {feeds.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-orange-100 rounded-[2rem] p-16 text-center">
          <div className="text-6xl mb-6 grayscale opacity-20">🌾</div>
          <h3 className="text-xl font-black text-gray-900 mb-2">Sem registros de trato</h3>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-8">Inicie o monitoramento alimentar criando um novo registro</p>
          <Button variant="primary" onClick={() => setShowForm(true)} className="rounded-xl font-black px-8 shadow-lg shadow-orange-200">
            COMEÇAR AGORA
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Histórico de Nutrição</h2>
          </div>

          <Card className="border-none shadow-2xl shadow-orange-100/30 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-orange-50/30 border-b border-orange-100/50">
                    <th className="p-6 text-left text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em]">Destinatário</th>
                    <th className="p-6 text-left text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em]">Data/Hora</th>
                    <th className="p-6 text-left text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em]">Carga (KG)</th>
                    <th className="p-6 text-left text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em]">Fórmula</th>
                    <th className="p-6 text-left text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em]">Observações</th>
                    <th className="p-6 text-center text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em]">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50/50">
                  {feeds.map(feed => {
                    const targetGroup = groups.find(g => g.id === feed.groupId);
                    const targetCage = cages.find(c => c.id === feed.cageId);
                    const targetBox = growthBoxes.find(b => b.id === feed.cageId);
                    const targetBatch = batches.find(b => b.id === feed.batchId);

                    return (
                      <tr key={feed.id} className="hover:bg-orange-50/30 transition-colors group">
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-black text-xs shadow-inner">
                              {targetBox ? 'BOX' : 'CAGE'}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-black text-gray-900 uppercase tracking-tight">
                                {targetBox ? targetBox.name : targetCage ? targetCage.name : targetGroup?.name || 'Geral'}
                              </span>
                              {targetBatch && <span className="text-[10px] font-bold text-orange-400 uppercase tracking-tighter">Lote #{targetBatch.batchNumber || targetBatch.name}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="p-6 font-bold text-gray-500 tabular-nums">
                          {formatDateTime(feed.date)}
                        </td>
                        <td className="p-6">
                          <span className="px-3 py-1.5 rounded-lg bg-orange-600 text-white font-black text-sm shadow-sm group-hover:scale-105 transition-transform inline-block tabular-nums">
                            {formatQuantity(feed.quantity)}
                          </span>
                        </td>
                        <td className="p-6 font-bold text-gray-900 uppercase text-xs tracking-tight">
                          {feed.feedTypeName || feed.type}
                        </td>
                        <td className="p-6 max-w-[200px]">
                          <p className="text-[10px] font-bold text-gray-400 uppercase leading-relaxed line-clamp-2">
                            {feed.notes || "SEM OBSERVAÇÕES ADICIONAIS"}
                          </p>
                        </td>
                        <td className="p-6 text-center">
                          <button
                            onClick={() => handleDelete(feed.id)}
                            className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 className="w-5 h-5" strokeWidth={2.5} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
