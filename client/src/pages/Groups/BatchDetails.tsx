import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Loading from "@/components/ui/Loading";
import Modal from "@/components/ui/Modal";
import { useBatchById, useBatches } from "@/hooks/useBatches";
import { useProduction } from "@/hooks/useProduction";
import { useMortality } from "@/hooks/useMortality";
import { useFeed } from "@/hooks/useFeed";
import { useSales } from "@/hooks/useSales";
import { formatDate, getDaysDifference } from "@/utils/date";
import { formatQuantity } from "@/utils/format";
import { useCages } from "@/hooks/useCages";
import { useGroups } from "@/hooks/useGroups";
import { aviariesApi, Aviary } from "@/api/aviaries";
import { supabaseClient, supabase } from "@/api/supabaseClient";
import { operationalApi, type EnvironmentalCondition } from "@/api/operational";
import { Thermometer, Droplets, Wind, History as HistoryIcon, LayoutDashboard, Plus, Edit, ExternalLink, Sparkles } from 'lucide-react';

import { useWarehouse } from "@/hooks/useWarehouse";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/utils/format";

export default function GroupDetails() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/batches/:id");
  const batchId = params?.id || "";
  console.log("DEBUG: BatchDetails rendering with ID:", batchId);

  const { batch: group, isLoading: groupLoading, error: groupError } = useBatchById(batchId);
  console.log("DEBUG: Batch data fetched:", group, "Loading:", groupLoading, "Error:", groupError);

  const { update: updateGroup, create: createGroup, isUpdating: isUpdatingGroup, isCreating: isCreatingGroup } = useBatches();
  const { productions } = useProduction(batchId, true);
  const { mortalities: batchMortalities } = useMortality(batchId, true);
  const { feeds: batchFeeds } = useFeed(batchId, true);
  console.log("DEBUG: Batch Feeds fetched:", batchFeeds);

  // Fetch Box-level history if it's a growth box
  const { mortalities: boxMortalities } = useMortality(group?.cageId, false);
  const { feeds: boxFeeds } = useFeed(group?.cageId, false);

  const feeds = [...batchFeeds, ...boxFeeds.filter(bf => !batchFeeds.some(af => af.id === bf.id))];
  const mortalities = [...batchMortalities, ...boxMortalities.filter(bm => !batchMortalities.some(am => am.id === bm.id))];

  const { sales } = useSales(batchId, true);

  const { cages, create: createCage, update: updateCage } = useCages();
  const { groups: sheds } = useGroups();
  const { addInventory } = useWarehouse();

  // Transfer Modal State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [transferSummary, setTransferSummary] = useState<string[]>([]);

  // Sexing State
  const [maleQty, setMaleQty] = useState("");
  const [femaleQty, setFemaleQty] = useState("");

  // Destinations
  const [maleCageId, setMaleCageId] = useState("");
  const [femaleCageId, setFemaleCageId] = useState("");

  // Hierarchy State
  const [aviaries, setAviaries] = useState<Aviary[]>([]);

  const [maleAviaryId, setMaleAviaryId] = useState("");
  const [maleGroupId, setMaleGroupId] = useState(""); // Group ID (Type is inferred from group)

  const [femaleAviaryId, setFemaleAviaryId] = useState("");
  const [femaleGroupId, setFemaleGroupId] = useState("");

  // Breeder Split State
  const [splitMales, setSplitMales] = useState(false);
  const [maleBreederQty, setMaleBreederQty] = useState("");
  const [maleBreederAviaryId, setMaleBreederAviaryId] = useState("");
  const [maleBreederGroupId, setMaleBreederGroupId] = useState("");
  const [maleBreederCageId, setMaleBreederCageId] = useState("");
  const [newMaleBreederCageName, setNewMaleBreederCageName] = useState("");
  const [newMaleBreederCageCapacity, setNewMaleBreederCageCapacity] = useState("50");

  const [splitFemales, setSplitFemales] = useState(false);
  const [femaleBreederQty, setFemaleBreederQty] = useState("");
  const [femaleBreederAviaryId, setFemaleBreederAviaryId] = useState("");
  const [femaleBreederGroupId, setFemaleBreederGroupId] = useState("");
  const [femaleBreederCageId, setFemaleBreederCageId] = useState("");
  const [newFemaleBreederCageName, setNewFemaleBreederCageName] = useState("");
  const [newFemaleBreederCageCapacity, setNewFemaleBreederCageCapacity] = useState("50");

  // Warehouse Transfer State
  const [isWarehouseTransferModalOpen, setIsWarehouseTransferModalOpen] = useState(false);
  const [warehouseTransferQuantity, setWarehouseTransferQuantity] = useState("");

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Environmental Monitoring State
  const [showClimateModal, setShowClimateModal] = useState(false);
  const [climateData, setClimateData] = useState<EnvironmentalCondition[]>([]);
  const [newClimate, setNewClimate] = useState({
    temperatura: '',
    umidade: '',
    amonia: '',
    observacoes: ''
  });

  useEffect(() => {
    if (batchId) {
      const fetchLogs = async () => {
        try {
          setLoadingAudit(true);
          const data = await supabaseClient.get(`/audit/lotes/${batchId}`);
          setAuditLogs(data || []);
        } catch (err) {
          console.error("Error fetching audit logs:", err);
        } finally {
          setLoadingAudit(false);
        }
      };
      fetchLogs();
    }
  }, [batchId]);

  const fetchClimate = async () => {
    if (!group) return;
    try {
      const data = await operationalApi.environmental.getByLocation(group.cageId ? 'gaiola' : 'galpao', group.cageId || group.galpao_id);
      setClimateData(data);
    } catch (err) {
      console.error("Error fetching climate:", err);
    }
  };

  useEffect(() => {
    if (group) {
      fetchClimate();
    }
  }, [group]);

  useEffect(() => {
    aviariesApi.getAll().then(data => {
      setAviaries(data);
      // Auto-select if only one aviary
      if (data.length === 1) {
        setMaleAviaryId(data[0].id);
        setFemaleAviaryId(data[0].id);
        setMaleBreederAviaryId(data[0].id);
        setFemaleBreederAviaryId(data[0].id);
      }
    });
  }, []);

  // Auto-select Groups when Aviary is selected

  // 1. Males (Production)
  useEffect(() => {
    if (maleAviaryId && sheds) {
      const group = sheds.find(s => s.aviaryId === maleAviaryId && s.type === 'males');
      if (group) setMaleGroupId(group.id);
    }
  }, [maleAviaryId, sheds]);

  // 2. Males (Breeders)
  useEffect(() => {
    if (maleBreederAviaryId && sheds) {
      const group = sheds.find(s => s.aviaryId === maleBreederAviaryId && s.type === 'breeders');
      if (group) setMaleBreederGroupId(group.id);
    }
  }, [maleBreederAviaryId, sheds]);

  // 3. Females (Production)
  useEffect(() => {
    if (femaleAviaryId && sheds) {
      const group = sheds.find(s => s.aviaryId === femaleAviaryId && s.type === 'production');
      if (group) setFemaleGroupId(group.id);
    }
  }, [femaleAviaryId, sheds]);

  // 4. Females (Breeders)
  useEffect(() => {
    if (femaleBreederAviaryId && sheds) {
      const group = sheds.find(s => s.aviaryId === femaleBreederAviaryId && s.type === 'breeders');
      if (group) setFemaleBreederGroupId(group.id);
    }
  }, [femaleBreederAviaryId, sheds]);

  // Inline Cage Creation State
  const [newMaleCageName, setNewMaleCageName] = useState("");
  const [newMaleCageCapacity, setNewMaleCageCapacity] = useState("50");
  const [newFemaleCageName, setNewFemaleCageName] = useState("");
  const [newFemaleCageCapacity, setNewFemaleCageCapacity] = useState("50");

  const [isMortalityModalOpen, setIsMortalityModalOpen] = useState(false);
  const [mortalityQuantity, setMortalityQuantity] = useState("");

  const handleRegisterMortality = async () => {
    if (!mortalityQuantity || !group) return;
    const qty = parseInt(mortalityQuantity);

    try {
      const newHistory = [
        ...(group.history || []),
        {
          date: new Date().toISOString(),
          event: "Mortalidade (Caixa)",
          quantity: qty,
          details: `Registrado manualmente na caixa.`
        }
      ];

      await updateGroup({
        id: batchId,
        data: {
          quantity: group.quantity - qty,
          history: newHistory
        }
      });

      setIsMortalityModalOpen(false);
      setMortalityQuantity("");
      toast.success("Mortalidade registrada.");
    } catch (error) {
      console.error("Erro ao registrar mortalidade:", error);
      toast.error("Erro ao registrar.");
    }
  };

  const handleTransfer = async () => {
    if (!group) return;

    const totalMales = parseInt(maleQty) || 0;
    const totalFemales = parseInt(femaleQty) || 0;
    const totalTransfer = totalMales + totalFemales;

    if (totalTransfer <= 0) {
      toast.error("Informe a quantidade de aves para transferir.");
      return;
    }

    if (totalTransfer > group.quantity) {
      toast.error(`Quantidade total (${totalTransfer}) excede o disponível no lote (${group.quantity}).`);
      return;
    }

    // Calculate Splits
    const malesBreeder = splitMales ? (parseInt(maleBreederQty) || 0) : 0;
    const malesProd = totalMales - malesBreeder;

    const femalesBreeder = splitFemales ? (parseInt(femaleBreederQty) || 0) : 0;
    const femalesProd = totalFemales - femalesBreeder;

    if (malesProd < 0 || malesBreeder < 0 || femalesProd < 0 || femalesBreeder < 0) {
      toast.error("Quantidades inválidas na divisão.");
      return;
    }

    // Validate Destinations
    if (malesProd > 0) {
      if (!maleCageId) return toast.error("Selecione uma gaiola para os Machos (Produção).");
      if (maleCageId === "new" && !newMaleCageName) return toast.error("Nome da nova gaiola (Machos Produção) obrigatório.");
    }
    if (malesBreeder > 0) {
      if (!maleBreederCageId) return toast.error("Selecione uma gaiola para os Machos (Reprodutores).");
      if (maleBreederCageId === "new" && !newMaleBreederCageName) return toast.error("Nome da nova gaiola (Machos Reprodutores) obrigatório.");
    }
    if (femalesProd > 0) {
      if (!femaleCageId) return toast.error("Selecione uma gaiola para as Fêmeas (Postura).");
      if (femaleCageId === "new" && !newFemaleCageName) return toast.error("Nome da nova gaiola (Fêmeas Postura) obrigatório.");
    }
    if (femalesBreeder > 0) {
      if (!femaleBreederCageId) return toast.error("Selecione uma gaiola para as Fêmeas (Reprodutoras).");
      if (femaleBreederCageId === "new" && !newFemaleBreederCageName) return toast.error("Nome da nova gaiola (Fêmeas Reprodutoras) obrigatório.");
    }

    // Capacity Validation
    const validateCapacity = (qty: number, cageId: string, newCapacityStr: string, label: string) => {
      if (qty <= 0) return true;
      let capacity = 0;
      let current = 0;
      let cageName = "";

      if (cageId === "new") {
        capacity = parseInt(newCapacityStr) || 0;
        current = 0;
        cageName = "Nova Gaiola";
      } else {
        const c = cages.find(x => x.id === cageId);
        if (!c) return true;
        capacity = c.capacity || 0;
        current = c.currentQuantity || 0;
        cageName = c.name;
      }

      if (current + qty > capacity) {
        toast.error(`⛔ BLOQUEADO: A gaiola de destino (${label} - ${cageName}) não suporta a quantidade.\n\nCapacidade: ${capacity}\nAtual: ${current}\nTentativa: ${qty}\nDisponível: ${capacity - current}`, { duration: 6000 });
        return false;
      }
      return true;
    };

    if (!validateCapacity(malesProd, maleCageId, newMaleCageCapacity, "Machos Produção")) return;
    if (!validateCapacity(malesBreeder, maleBreederCageId, newMaleBreederCageCapacity, "Machos Reprodutores")) return;
    if (!validateCapacity(femalesProd, femaleCageId, newFemaleCageCapacity, "Fêmeas Postura")) return;
    if (!validateCapacity(femalesBreeder, femaleBreederCageId, newFemaleBreederCageCapacity, "Fêmeas Reprodutoras")) return;

    try {
      const transferDate = new Date().toISOString();
      const summary: string[] = [];

      // Sequential processing helper
      const processTransfer = async (
        qty: number,
        cageId: string,
        newCageName: string,
        newCageCap: string,
        groupId: string,
        destPhase: string,
        label: string,
        malesTrace: number,
        femalesTrace: number
      ) => {
        if (qty <= 0) return;

        let targetCageId = cageId;
        const cageCapacity = parseInt(newCageCap) || 50;

        // 1. Create Cage if needed
        if (cageId === "new") {
          const newCage = await createCage({
            name: newCageName,
            capacity: cageCapacity,
            status: "active",
            type: destPhase === "postura" ? "production" : (destPhase === "machos" ? "males" : "breeders"),
            groupId: groupId
          });
          targetCageId = newCage.id;
          summary.push(`Nova gaiola criada: ${newCageName}`);
        }

        const cageObj = cages.find(c => c.id === targetCageId);
        const currentCageQty = cageObj?.currentQuantity || 0;
        const cageNameDisplay = cageObj?.name || newCageName;

        // 2. Create Target Batch
        const newBatch = await createGroup({
          name: `${group.name} (${label})`,
          species: group.species,
          quantity: qty,
          males: malesTrace,
          females: femalesTrace,
          parentId: group.id,
          cageId: targetCageId,
          phase: destPhase as any,
          originId: group.id,
          batchId: (group as any).batchId || group.id,
          birthDate: group.birthDate,
          notes: `Transferido de ${group.gaiola_name || "Caixa"}. Origem: ${group.name}`,
          history: [{
            date: transferDate,
            event: "Lote Criado (Transferência)",
            quantity: qty,
            details: `${label} recebidos da ${group.gaiola_name || "Caixa"}`,
            origin: group.id
          }]
        });

        // 2a. Register detailed transfer in bird_transfers for Rastreabilidade Total v7.0
        await supabase.from('bird_transfers').insert({
          origin_batch_id: group.id,
          dest_batch_id: newBatch.id,
          origin_cage_id: group.cageId || null,
          dest_cage_id: targetCageId,
          males_count: malesTrace,
          females_count: femalesTrace,
          transfer_date: transferDate,
          notes: `Rastreabilidade v7.0: Transferência de ${label} (Origem: ${group.name})`
        });

        // 3. Update Cage Occupancy (Server should handle this via syncCageQuantity, but we keep UI consistency)
        await updateCage({
          id: targetCageId,
          data: { currentQuantity: currentCageQty + qty }
        });

        summary.push(`${qty} ${label} transferidos para ${cageNameDisplay}`);
      };

      // EXECUTE SEQUENTIALLY
      if (malesProd > 0) {
        await processTransfer(malesProd, maleCageId, newMaleCageName, newMaleCageCapacity, maleGroupId, "machos", "Machos", malesProd, 0);
      }
      if (malesBreeder > 0) {
        await processTransfer(malesBreeder, maleBreederCageId, newMaleBreederCageName, newMaleBreederCageCapacity, maleBreederGroupId, "reprodutoras", "Reprodutores", malesBreeder, 0);
      }
      if (femalesProd > 0) {
        await processTransfer(femalesProd, femaleCageId, newFemaleCageName, newFemaleCageCapacity, femaleGroupId, "postura", "Poedeiras", 0, femalesProd);
      }
      if (femalesBreeder > 0) {
        await processTransfer(femalesBreeder, femaleBreederCageId, newFemaleBreederCageName, newFemaleBreederCageCapacity, femaleBreederGroupId, "reprodutoras", "Reprodutoras", 0, femalesBreeder);
      }

      // 4. Update Source Batch (ONCE)
      const newRemainingQty = Math.max(0, group.quantity - totalTransfer);
      await updateGroup({
        id: group.id,
        data: {
          status: newRemainingQty <= 0 ? "inactive" : "active",
          quantity: newRemainingQty,
          notes: (group.notes || "") + `\n[${new Date().toLocaleDateString()}] Transferência concluída: ${totalTransfer} aves.`,
          history: [
            ...(group.history || []),
            {
              date: transferDate,
              event: "Transferência / Sexagem",
              quantity: totalTransfer,
              details: `Resumo: ${malesProd} Machos, ${malesBreeder} Reprodutores, ${femalesProd} Poedeiras, ${femalesBreeder} Reprodutoras.`,
              origin: group.id
            }
          ]
        }
      });

      setTransferSummary(summary);
      setTransferSuccess(true);
    } catch (error) {
      console.error("Erro na transferência:", error);
      toast.error("Erro ao realizar transferência.");
    }
  };

  const handleTransferToWarehouse = async () => {
    if (!warehouseTransferQuantity || !group) return;
    const qty = parseInt(warehouseTransferQuantity);

    if (qty > group.quantity) {
      toast.error("Quantidade maior que o disponível no lote.");
      return;
    }

    try {
      const transferDate = new Date().toISOString();

      // 1. Add to Warehouse
      await addInventory({
        type: "chick",
        subtype: `codorna pinto - ${group.name}`,
        quantity: qty,
        origin: {
          groupId: group.id,
          batchId: group.id,
          date: transferDate
        }
      });

      // 2. Update Batch History & Quantity
      const newHistory = [
        ...(group.history || []),
        {
          date: transferDate,
          event: "Transferência (Armazém)",
          quantity: qty,
          details: `Transferido para Armazém (Pintos).`,
          origin: group.id
        }
      ];

      await updateGroup({
        id: group.id,
        data: {
          status: (group.quantity - qty) <= 0 ? "inactive" : "active",
          quantity: Math.max(0, group.quantity - qty),
          history: newHistory
        }
      });

      setIsWarehouseTransferModalOpen(false);
      setWarehouseTransferQuantity("");
      toast.success("Transferência para o armazém realizada com sucesso!");
      window.location.reload();

    } catch (error) {
      console.error("Erro ao transferir para armazém:", error);
      toast.error("Erro ao transferir.");
    }
  };

  if (groupLoading) {
    return <Loading fullScreen message="Carregando grupo..." />;
  }

  // Only show Not Found if loading is done and group is null
  if (!groupLoading && !group) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Lote não encontrado</h1>
        <p className="text-gray-600">O lote solicitado não existe ou foi removido.</p>
        <Button variant="primary" onClick={() => setLocation("/batches/growth")}>
          Voltar para Caixas
        </Button>
      </div>
    );
  }

  const ageInDays = group.birthDate
    ? getDaysDifference(new Date(group.birthDate), new Date())
    : 0;

  const handleRegisterClimate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group) return;

    try {
      await operationalApi.environmental.create({
        galpao_id: group.galpao_id,
        gaiola_id: group.cageId,
        temperatura: newClimate.temperatura ? parseFloat(newClimate.temperatura) : undefined,
        umidade: newClimate.umidade ? parseFloat(newClimate.umidade) : undefined,
        amonia: newClimate.amonia ? parseFloat(newClimate.amonia) : undefined,
        data_leitura: new Date().toISOString(),
        observacoes: newClimate.observacoes
      });

      toast.success("Dados ambientais registrados!");
      setShowClimateModal(false);
      setNewClimate({ temperatura: '', umidade: '', amonia: '', observacoes: '' });
      fetchClimate();
    } catch (err) {
      toast.error("Erro ao registrar ambiente");
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100/50">
            Gerenciamento de Lote
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">{group.name}</h1>
          <p className="text-gray-500 font-medium text-lg leading-relaxed">
            {group.species} • Unidade: <span className="text-orange-600 font-bold">{group.gaiola_name || "N/A"}</span>
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="rounded-xl border-orange-100 text-orange-600 hover:bg-orange-50 font-bold"
          >
            ⬅️ Voltar
          </Button>
          <Button
            variant="secondary"
            onClick={() => setLocation(`/batches/${batchId}/edit`)}
            className="rounded-xl font-black border-orange-100 text-orange-600 hover:bg-orange-50"
          >
            EDITAR
          </Button>
          <Button
            variant="outline"
            onClick={() => setLocation(`/batches/${batchId}/qrcode`)}
            className="rounded-xl font-black border-orange-100 text-orange-600 hover:bg-orange-50"
          >
            QR CODE
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {[
          { label: "Quantidade", value: formatQuantity(group.quantity), icon: "🪶", desc: "Aves Ativas" },
          { label: "Machos", value: group.males || 0, icon: "♂️", desc: "Contagem Sexada" },
          { label: "Fêmeas", value: group.females || 0, icon: "♀️", desc: "Contagem Sexada" },
          { label: "Idade (dias)", value: ageInDays, icon: "📅", desc: "Ciclo de Vida" },
          { label: "Status", value: group.status, icon: "⚡", desc: "Estado Atual" },
          { label: "Localização", value: group.aviary_city || "N/A", icon: "📍", desc: "Aviário/Sede" }
        ].map((stat, i) => (
          <Card key={i} className="hover:shadow-2xl hover:shadow-orange-200/50 transition-all duration-300 border-none relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-orange-50 rounded-full -mr-8 -mt-8 opacity-50 group-hover:bg-orange-100 transition-colors"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xl">{stat.icon}</span>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
              </div>
              <p className="text-3xl font-black text-gray-900 tabular-nums uppercase">{stat.value}</p>
              <p className="text-[9px] font-bold text-orange-600 uppercase tracking-widest mt-1 opacity-70">{stat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {group.phase === "crescimento" && (
        <Card className="border-none shadow-2xl shadow-orange-100/50 overflow-hidden rounded-[2rem] bg-white">
          <div className="h-3 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600"></div>
          <CardHeader className="p-8 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl font-black text-gray-900 tracking-tight uppercase">Painel de Controle</CardTitle>
                <CardDescription className="text-xs font-bold text-orange-600 uppercase tracking-[0.2em] mt-1">Gestão de Recria (Ciclo de 35 Dias)</CardDescription>
              </div>
              <div className="px-4 py-2 bg-orange-50 rounded-2xl border border-orange-100">
                <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Fase Ativa</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: "Unidade", value: group.gaiola_name?.replace(/([a-zA-Z]+)(\d+)/, '$1 $2') || "N/A", sub: "Alojamento" },
                { label: "Lote Genérico", value: group.name, sub: "Identidade" },
                { label: "Status", value: group.status === 'active' ? 'Ocupada' : 'Finalizada', sub: "Ocupação", highlight: true },
                { label: "Idade", value: group.status === 'active' ? `${ageInDays} dias` : 'Encerrado', sub: "Ciclo" },
                { label: "Plantel", value: formatQuantity(group.quantity), sub: "Aves Vivas" },
                {
                  label: "Deadline",
                  value: (() => {
                    if (!group.birthDate) return "N/A";
                    const date = new Date(group.birthDate);
                    date.setDate(date.getDate() + 35);
                    return date.toLocaleDateString();
                  })(),
                  sub: "Saída (35d)",
                  critical: ageInDays >= 35
                }
              ].map((item, i) => (
                <div key={i} className={`p-4 rounded-2xl border ${item.critical ? 'bg-red-50 border-red-100' : 'bg-orange-50/30 border-orange-100/50'} transition-all hover:bg-white hover:shadow-lg group/item`}>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover/item:text-orange-600 transition-colors">{item.label}</p>
                  <p className={`text-lg font-black tracking-tight uppercase ${item.critical ? 'text-red-600' : 'text-gray-900'}`}>{item.value}</p>
                  <p className="text-[8px] font-bold text-gray-300 uppercase mt-0.5 tracking-tighter">{item.sub}</p>
                </div>
              ))}
            </div>

            {ageInDays >= 35 && group.status === 'active' && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white text-xl">⚠️</div>
                <div>
                  <p className="text-xs font-black text-red-900 uppercase tracking-widest leading-none mb-1">Prazo de Recria Expirado</p>
                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-tighter">O lote atingiu a maturidade e deve ser transferido para o setor de postura.</p>
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-4 pt-4">
              {group.status === 'active' ? (
                <>
                  <Button
                    variant="primary"
                    className={`flex-1 py-8 rounded-2xl font-black text-xl shadow-2xl transition-all ${ageInDays >= 35 ? "bg-red-600 hover:bg-red-700 shadow-red-200" : "bg-orange-600 hover:bg-orange-700 shadow-orange-200"}`}
                    onClick={() => setShowTransferModal(true)}
                  >
                    {ageInDays >= 35 ? "URGENTE: REALIZAR TRANSFERÊNCIA ➔" : "TRANSFERIR PARA POSTURA ➔"}
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1 py-8 rounded-2xl font-black text-xl bg-purple-600 hover:bg-purple-700 shadow-2xl shadow-purple-200"
                    onClick={() => setIsWarehouseTransferModalOpen(true)}
                  >
                    TRANSFERIR PARA ARMAZÉM 🏭
                  </Button>
                </>
              ) : (
                <div className="w-full bg-gray-50 p-6 rounded-[2rem] text-center border-2 border-dashed border-gray-100">
                  <p className="text-gray-400 font-black uppercase tracking-widest text-sm">
                    🚫 CICLO DE RECRIA FINALIZADO E ARQUIVADO
                  </p>
                </div>
              )}
            </div>

            {auditLogs && auditLogs.length > 0 && (
              <div className="pt-6 border-t border-orange-50">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Fluxo de Atividades Recentes</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(() => {
                    const combinedHistory = [
                      ...(auditLogs || []).map(log => ({
                        type: 'audit',
                        date: log.created_at,
                        label: log.action.toUpperCase(),
                        subLabel: typeof log.details === 'string' ? log.details : (log.details?.status || ''),
                        color: 'blue'
                      })),
                      ...(feeds || []).slice(0, 5).map(f => ({
                        type: 'feed',
                        date: f.executedAt || f.date,
                        label: 'TRATO',
                        subLabel: `${f.feedTypeName} (${f.quantity}kg)`,
                        color: 'green'
                      })),
                      ...(mortalities || []).slice(0, 5).map(m => ({
                        type: 'mortality',
                        date: m.date,
                        label: 'BAIXA',
                        subLabel: `${m.quantity} aves`,
                        color: 'red'
                      }))
                    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4);

                    return (combinedHistory || []).map((item, index) => (
                      <div key={index} className="flex items-center gap-3 bg-orange-50/20 p-3 rounded-xl border border-orange-100/30 group">
                        <div className={`w-2 h-2 rounded-full ${item.color === 'blue' ? 'bg-blue-500' : item.color === 'green' ? 'bg-green-500' : 'bg-red-500'} group-hover:scale-125 transition-transform`}></div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-tight truncate">{item.subLabel}</span>
                          <span className="text-[8px] font-bold text-orange-400/60 uppercase">{formatDateTime(item.date)}</span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Overview Cards & Climate Monitoring - v13.0 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sumário Principal */}
        <Card className="md:col-span-2 bg-white border-none shadow-xl shadow-gray-100 rounded-[32px] overflow-hidden">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-100">
                  <LayoutDashboard className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Sumário do Lote</h3>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${group.status === "ativo" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                }`}>
                {group.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quantidade Atual</p>
                <p className="text-2xl font-black text-gray-900 flex items-baseline gap-1">
                  {group.quantity} <span className="text-[10px] text-gray-400">aves</span>
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Idade do Lote</p>
                <p className="text-2xl font-black text-gray-900 flex items-baseline gap-1">
                  {ageInDays} <span className="text-[10px] text-gray-400">dias</span>
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gênero (Machos)</p>
                <p className="text-xl font-black text-blue-600">{group.males || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gênero (Fêmeas)</p>
                <p className="text-xl font-black text-pink-600">{group.females || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Climate Card */}
        <Card className="bg-white border-none shadow-xl shadow-blue-50/50 rounded-[32px] overflow-hidden border-l-4 border-blue-500">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-2.5 rounded-xl">
                  <Thermometer className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Monitoramento</h3>
              </div>
              <button
                onClick={() => setShowClimateModal(true)}
                className="p-2 hover:bg-blue-50 text-blue-600 rounded-xl transition-colors"
                title="Registrar Clima"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {climateData.length > 0 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Thermometer className="w-8 h-8 text-orange-500" />
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Temp.</p>
                      <p className="text-xl font-black text-gray-900">{climateData[0].temperatura}°C</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Droplets className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Umidade</p>
                      <p className="text-xl font-black text-gray-900">{climateData[0].umidade}%</p>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Última Leitura</span>
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    {format(new Date(climateData[0].data_leitura), 'HH:mm - dd/MM')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                <Wind className="w-10 h-10 text-gray-100" />
                <p className="text-[10px] font-bold text-gray-400 uppercase max-w-[150px]">
                  Nenhum dado climático registrado hoje
                </p>
                <button
                  onClick={() => setShowClimateModal(true)}
                  className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest"
                >
                  Registrar Agora
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-none shadow-xl shadow-orange-100/30 overflow-hidden rounded-[2rem] bg-white group hover:shadow-2xl transition-all duration-300">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-orange-600/50 uppercase tracking-widest">Nascimento</p>
                <p className="text-sm font-black text-gray-900 tabular-nums">{group.birthDate ? formatDate(group.birthDate) : "N/A"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-orange-600/50 uppercase tracking-widest">Cadastro</p>
                <p className="text-sm font-black text-gray-900 tabular-nums">{formatDateTime(group.createdAt)}</p>
              </div>
            </div>

            {group.notes && (
              <div className="space-y-2">
                <p className="text-[10px] font-black text-orange-600/50 uppercase tracking-widest">Histórico & Notas</p>
                <div className="bg-orange-50/50 p-4 rounded-2xl text-[11px] font-bold text-gray-600 whitespace-pre-wrap leading-relaxed border border-orange-100/30">
                  {group.notes}
                </div>
              </div>
            )}

            {group.phase !== "crescimento" && group.status === 'active' && (
              <div className="pt-4 mt-2 border-t border-orange-50">
                <Button
                  variant="outline"
                  className="w-full py-4 rounded-xl border-orange-100 text-orange-600 hover:bg-orange-50 font-black text-[10px] uppercase tracking-widest transition-all"
                  onClick={async () => {
                    if (confirm("Deseja configurar este grupo como uma Caixa de Crescimento?")) {
                      await updateGroup({
                        id: batchId,
                        data: { phase: "crescimento" }
                      });
                      window.location.reload();
                    }
                  }}
                >
                  📦 Configurar Ciclo de Recria
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl shadow-orange-100/30 overflow-hidden rounded-[2rem] bg-white group hover:shadow-2xl transition-all duration-300">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Resumo Operacional</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Produção", value: productions.length, unit: "Lançamentos", color: "orange" },
                { label: "Mortalidade", value: mortalities.length, unit: "Ocorrências", color: "red" },
                { label: "Alimentação", value: feeds.length, unit: "Tratos", color: "green" },
                { label: "Vendas", value: sales.length, unit: "Pedidos", color: "purple" }
              ].map((stat, i) => (
                <div key={i} className="p-4 rounded-2xl bg-orange-50/30 border border-orange-100/50 hover:bg-white hover:shadow-md transition-all group/stat">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover/stat:text-orange-600 transition-colors">{stat.label}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-gray-900 tabular-nums">{stat.value}</span>
                    <span className="text-[8px] font-bold text-gray-300 uppercase tracking-tighter">{stat.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl shadow-orange-100/30 overflow-hidden rounded-[2rem] bg-white flex flex-col justify-center p-6 gap-3">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 px-2">Ações Rápidas</p>
          {group.status === 'active' ? (
            <div className="grid grid-cols-1 gap-3">
              {group.phase !== "crescimento" && (
                <Button
                  variant="primary"
                  className="w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-200"
                  onClick={() => setLocation(`/production?groupId=${batchId}`)}
                >
                  Registrar Produção
                </Button>
              )}
              {group.phase !== "crescimento" && (
                <>
                  <Button
                    variant="primary"
                    className="w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200"
                    onClick={() => setLocation(`/mortality?groupId=${batchId}`)}
                  >
                    Registrar Mortalidade
                  </Button>
                  <Button
                    variant="primary"
                    className="w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200"
                    onClick={() => setLocation(`/feed?batchId=${batchId}`)}
                  >
                    Registrar Alimentação
                  </Button>
                </>
              )}

              {group.phase === "crescimento" ? (
                <Button
                  variant="primary"
                  className="w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200"
                  onClick={() => setIsWarehouseTransferModalOpen(true)}
                >
                  Transferir Pintos
                </Button>
              ) : (
                <Button
                  variant="primary"
                  className="w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200"
                  onClick={() => setLocation(`/sales?groupId=${batchId}`)}
                >
                  Registrar Venda
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 grayscale opacity-50">
              <span className="text-4xl">🔒</span>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">Ações Desativadas</p>
            </div>
          )}
        </Card>
      </div>

      {/* History Tabs */}
      <Card className="mt-8 border-none shadow-2xl shadow-orange-100/30 overflow-hidden rounded-[2rem] bg-white">
        <CardHeader className="p-8 pb-4">
          <CardTitle className="text-2xl font-black text-gray-900 uppercase tracking-tight">Histórico de Atividades</CardTitle>
          <CardDescription className="text-xs font-bold text-orange-600 uppercase tracking-widest mt-1">Rastreabilidade completa do ciclo de vida</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <Tabs defaultValue="feed" className="w-full">
            <TabsList className="inline-flex p-1 bg-orange-50/50 rounded-2xl border border-orange-100/50 mb-8">
              {[
                { value: "feed", label: "Alimentação", icon: "🌾" },
                { value: "production", label: "Produção", icon: "🥚" },
                { value: "mortality", label: "Mortalidade", icon: "📉" },
                { value: "sales", label: "Vendas", icon: "💰" },
                { value: "audit", label: "Auditoria", icon: "📋" }
              ].map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-lg transition-all"
                >
                  <span className="mr-2 opacity-50">{tab.icon}</span> {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="feed">
              <div className="overflow-x-auto rounded-2xl border border-orange-100/50">
                <table className="w-full text-left">
                  <thead className="bg-orange-50/30 border-b border-orange-100/50">
                    <tr>
                      <th className="p-6 text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em]">Data</th>
                      <th className="p-6 text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em]">Destino</th>
                      <th className="p-6 text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em]">Fórmula</th>
                      <th className="p-6 text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em] text-right">Qtd (kg)</th>
                      <th className="p-6 text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em]">Obs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-50/50">
                    {feeds.length === 0 ? (
                      <tr><td colSpan={5} className="p-16 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">Nenhum registro de trato encontrado</td></tr>
                    ) : (
                      {(feeds || []).map(feed => (
                        <tr key={feed.id} className="hover:bg-orange-50/30 transition-colors group">
                          <td className="p-6 text-xs font-bold text-gray-500 tabular-nums">{formatDateTime(feed.date)}</td>
                          <td className="p-6">
                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm ${feed.batchId ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                              {feed.batchId ? 'Lote' : 'Caixa'}
                            </span>
                          </td>
                          <td className="p-6 font-black text-gray-900 uppercase text-xs">{feed.feedTypeName}</td>
                          <td className="p-6 text-right">
                            <span className="px-3 py-1.5 rounded-lg bg-orange-600 text-white font-black text-xs shadow-sm group-hover:scale-105 transition-transform inline-block tabular-nums">
                              {feed.quantity}
                            </span>
                          </td>
                          <td className="p-6 text-[10px] font-bold text-gray-400 uppercase leading-relaxed max-w-xs truncate">{feed.notes || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="production">
              <div className="overflow-x-auto rounded-2xl border border-orange-100/50">
                <table className="w-full text-left">
                  <thead className="bg-orange-50/30 border-b border-orange-100/50">
                    <tr>
                      <th className="p-6 text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em]">Data</th>
                      <th className="p-6 text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em] text-right">Qtd</th>
                      <th className="p-6 text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em]">Qualidade</th>
                      <th className="p-6 text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em]">Classificação</th>
                      <th className="p-6 text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em] text-right">Massa (g)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-50/50">
                    {productions.length === 0 ? (
                      <tr><td colSpan={5} className="p-16 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">Nenhum registro de postura encontrado</td></tr>
                    ) : (
                      {(productions || []).map(p => (
                        <tr key={p.id} className="hover:bg-orange-50/30 transition-colors group">
                          <td className="p-6 text-xs font-bold text-gray-500 tabular-nums">{formatDateTime(p.date)}</td>
                          <td className="p-6 text-right">
                            <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-black text-xs shadow-sm group-hover:scale-105 transition-transform inline-block tabular-nums">
                              {p.quantity}
                            </span>
                          </td>
                          <td className="p-6">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border shadow-sm ${p.quality === 'A' ? 'bg-green-50 text-green-700 border-green-100' : p.quality === 'B' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                              CAT {p.quality}
                            </span>
                          </td>
                          <td className="p-6 font-black text-gray-900 uppercase text-xs tracking-tight">{p.eggType === 'fertile' ? '🐣 Fértil' : '🍳 Comercial'}</td>
                          <td className="p-6 text-right font-black text-gray-400 tabular-nums text-xs">{p.weight || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="mortality">
              <div className="overflow-x-auto rounded-2xl border border-orange-100/50">
                <table className="w-full text-left">
                  <thead className="bg-orange-50/30 border-b border-orange-100/50">
                    <tr>
                      <th className="p-6 text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em]">Data</th>
                      <th className="p-6 text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em]">Alvo</th>
                      <th className="p-6 text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em] text-right">Aves</th>
                      <th className="p-6 text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em]">Nota</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-50/50">
                    {mortalities.length === 0 ? (
                      <tr><td colSpan={4} className="p-16 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">Nenhuma ocorrência registrada</td></tr>
                    ) : (
                      {(mortalities || []).map(m => (
                        <tr key={m.id} className="hover:bg-orange-50/30 transition-colors group">
                          <td className="p-6 text-xs font-bold text-gray-500 tabular-nums">{formatDateTime(m.date)}</td>
                          <td className="p-6">
                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm ${m.batchId ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                              {m.batchId ? 'Lote' : 'Caixa'}
                            </span>
                          </td>
                          <td className="p-6 text-right">
                            <span className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-black text-xs shadow-sm group-hover:scale-105 transition-transform inline-block tabular-nums">
                              {m.quantity}
                            </span>
                          </td>
                          <td className="p-6 text-[10px] font-bold text-gray-400 uppercase leading-relaxed max-w-sm truncate">{m.notes || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="sales">
              <div className="overflow-x-auto rounded-2xl border border-orange-100/50">
                <table className="w-full text-left">
                  <thead className="bg-orange-50/30 border-b border-orange-100/50">
                    <tr>
                      <th className="p-6 text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em]">Data</th>
                      <th className="p-6 text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em]">Cliente</th>
                      <th className="p-6 text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em] text-right">Qtd</th>
                      <th className="p-6 text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em] text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-50/50">
                    {sales.length === 0 ? (
                      <tr><td colSpan={4} className="p-16 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">Nenhuma venda faturada recentemente</td></tr>
                    ) : (
                      {(sales || []).map(s => (
                        <tr key={s.id} className="hover:bg-orange-50/30 transition-colors group">
                          <td className="p-6 text-xs font-bold text-gray-500 tabular-nums">{formatDate(s.date)}</td>
                          <td className="p-6 font-black text-gray-900 uppercase text-xs tracking-tight">{s.buyer || "N/A"}</td>
                          <td className="p-6 text-right font-black text-gray-400 tabular-nums text-xs">{s.quantity}</td>
                          <td className="p-6 text-right">
                            <span className="px-3 py-1.5 rounded-lg bg-green-600 text-white font-black text-xs shadow-sm group-hover:scale-105 transition-transform inline-block tabular-nums">
                              {formatCurrency(s.totalPrice || (s.unitPrice * s.quantity))}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="audit">
              <div className="space-y-4">
                {loadingAudit ? (
                  <div className="p-16 text-center text-[10px] font-black text-orange-600 uppercase tracking-widest animate-pulse">Consultando logs do sistema...</div>
                ) : auditLogs && auditLogs.length > 0 ? (
                  auditLogs.map((log, idx) => (
                    <div key={idx} className="flex gap-6 p-6 rounded-[1.5rem] border border-orange-100/50 bg-orange-50/20 hover:bg-white hover:shadow-xl transition-all group">
                      <div className="flex-none">
                        <div className="px-3 py-2 bg-white text-orange-600 rounded-xl border border-orange-100 font-black text-[9px] tracking-widest shadow-sm">
                          {formatDate(log.created_at)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-gray-900 uppercase text-xs tracking-widest group-hover:text-orange-600 transition-colors">{log.action}</p>
                        <div className="text-[10px] font-medium text-gray-500 mt-2 leading-relaxed opacity-80">
                          {typeof log.details === 'string' ? log.details : (
                            <pre className="whitespace-pre-wrap font-mono bg-orange-50/50 p-3 rounded-lg border border-orange-100/30 mt-2">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-orange-100/30">
                          <div className="w-4 h-4 rounded-full bg-orange-100 flex items-center justify-center text-[8px] text-orange-600 font-black">
                            {log.users?.name?.charAt(0) || "S"}
                          </div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                            Operador: <span className="text-orange-600/60 ">{log.users?.name || "Sistema Automático"}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-16 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest border-2 border-dashed border-orange-50 rounded-[2rem]">Nenhum evento crítico registrado</div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {
        showTransferModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-10">
            <Card className="w-full max-w-2xl mx-4">
              <CardHeader>
                <CardTitle>{transferSuccess ? "Sucesso! 🎉" : "Transferência e Sexagem"}</CardTitle>
                <CardDescription>
                  {transferSuccess
                    ? "A transferência foi realizada."
                    : "Distribua os machos e fêmeas para as gaiolas."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {transferSuccess ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h3 className="text-green-800 font-bold mb-2">Resumo da Operação:</h3>
                      <ul className="list-disc list-inside text-green-700 space-y-1">
                        {(transferSummary || []).map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      variant="primary"
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        setShowTransferModal(false);
                        setTransferSuccess(false);
                        setLocation("/batches/growth");
                      }}
                    >
                      Concluir e Voltar
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex justify-between items-center">
                      <div>
                        <p className="text-sm text-blue-600">Total no Lote</p>
                        <p className="text-2xl font-bold text-blue-900">{group.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-blue-600">Restante</p>
                        <p className={`text-2xl font-bold ${(group.quantity - (parseInt(maleQty) || 0) - (parseInt(femaleQty) || 0)) < 0 ? "text-red-600" : "text-blue-900"}`}>
                          {group.quantity - (parseInt(maleQty) || 0) - (parseInt(femaleQty) || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* MACHOS SECTION */}
                      <div className="space-y-4 border p-4 rounded-lg bg-blue-50">
                        <h3 className="font-bold text-lg flex items-center gap-2 text-blue-900">
                          🐓 Machos
                        </h3>
                        <Input
                          label="Quantidade Total de Machos"
                          type="number"
                          placeholder="0"
                          value={maleQty}
                          onChange={(e) => setMaleQty(e.target.value)}
                        />

                        {parseInt(maleQty) > 0 && (
                          <div className="space-y-3 animate-in fade-in slide-in-from-top-2">

                            <div className="flex items-center gap-2 mb-2">
                              <input
                                type="checkbox"
                                id="splitMales"
                                checked={splitMales}
                                onChange={(e) => setSplitMales(e.target.checked)}
                                className="w-4 h-4 text-blue-600"
                              />
                              <label htmlFor="splitMales" className="text-sm font-medium text-gray-700">Separar Reprodutores?</label>
                            </div>

                            {splitMales && (
                              <div className="pl-4 border-l-2 border-blue-300 mb-4">
                                <Input
                                  label="Qtd. para Reprodutores"
                                  type="number"
                                  value={maleBreederQty}
                                  onChange={(e) => setMaleBreederQty(e.target.value)}
                                  placeholder="0"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Restante para Produção: {(parseInt(maleQty) || 0) - (parseInt(maleBreederQty) || 0)}
                                </p>
                              </div>
                            )}

                            {/* DESTINATION 1: PRODUCTION MALES */}
                            {((parseInt(maleQty) || 0) - (splitMales ? (parseInt(maleBreederQty) || 0) : 0)) > 0 && (
                              <div className="bg-white p-3 rounded border border-gray-200">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Destino: Machos (Produção)</p>

                                <div className="space-y-2">
                                  <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    value={maleAviaryId}
                                    onChange={(e) => { setMaleAviaryId(e.target.value); setMaleGroupId(""); }}
                                  >
                                    <option value="">Selecione o Aviário...</option>
                                    {aviaries.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                  </select>

                                  <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    value={maleGroupId}
                                    onChange={(e) => setMaleGroupId(e.target.value)}
                                    disabled={!maleAviaryId}
                                  >
                                    <option value="">Selecione o Grupo (Machos)...</option>
                                    {sheds?.filter(s => s.aviaryId === maleAviaryId && s.type === 'males').map(s => (
                                      <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                  </select>

                                  <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    value={maleCageId}
                                    onChange={(e) => setMaleCageId(e.target.value)}
                                    disabled={!maleGroupId}
                                  >
                                    <option value="">Selecione a Gaiola...</option>
                                    <option value="new">➕ Nova Gaiola</option>
                                    {cages.filter(c => c.status === 'active' && c.groupId === maleGroupId).map(c => (
                                      <option key={c.id} value={c.id}>{c.name} ({c.currentQuantity}/{c.capacity})</option>
                                    ))}
                                  </select>
                                  {maleCageId === "new" && (
                                    <div className="pl-2 border-l-2 border-blue-500 space-y-2">
                                      <Input label="Nome" value={newMaleCageName} onChange={(e) => setNewMaleCageName(e.target.value)} />
                                      <Input label="Capacidade" type="number" value={newMaleCageCapacity} onChange={(e) => setNewMaleCageCapacity(e.target.value)} />
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* DESTINATION 2: BREEDER MALES */}
                            {splitMales && (parseInt(maleBreederQty) || 0) > 0 && (
                              <div className="bg-blue-100 p-3 rounded border border-blue-200 mt-2">
                                <p className="text-xs font-bold text-blue-700 uppercase mb-2">Destino: Reprodutores</p>

                                <div className="space-y-2">
                                  <select
                                    className="w-full px-3 py-2 border border-blue-300 rounded-md text-sm"
                                    value={maleBreederAviaryId}
                                    onChange={(e) => { setMaleBreederAviaryId(e.target.value); setMaleBreederGroupId(""); }}
                                  >
                                    <option value="">Selecione o Aviário...</option>
                                    {aviaries.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                  </select>

                                  <select
                                    className="w-full px-3 py-2 border border-blue-300 rounded-md text-sm"
                                    value={maleBreederGroupId}
                                    onChange={(e) => setMaleBreederGroupId(e.target.value)}
                                    disabled={!maleBreederAviaryId}
                                  >
                                    <option value="">Selecione o Grupo (Reprodutores)...</option>
                                    {sheds?.filter(s => s.aviaryId === maleBreederAviaryId && s.type === 'breeders').map(s => (
                                      <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                  </select>

                                  <select
                                    className="w-full px-3 py-2 border border-blue-300 rounded-md text-sm"
                                    value={maleBreederCageId}
                                    onChange={(e) => setMaleBreederCageId(e.target.value)}
                                    disabled={!maleBreederGroupId}
                                  >
                                    <option value="">Selecione a Gaiola...</option>
                                    <option value="new">➕ Nova Gaiola</option>
                                    {cages.filter(c => c.status === 'active' && c.groupId === maleBreederGroupId).map(c => (
                                      <option key={c.id} value={c.id}>{c.name} ({c.currentQuantity}/{c.capacity})</option>
                                    ))}
                                  </select>
                                  {maleBreederCageId === "new" && (
                                    <div className="pl-2 border-l-2 border-blue-500 space-y-2">
                                      <Input label="Nome" value={newMaleBreederCageName} onChange={(e) => setNewMaleBreederCageName(e.target.value)} />
                                      <Input label="Capacidade" type="number" value={newMaleBreederCageCapacity} onChange={(e) => setNewMaleBreederCageCapacity(e.target.value)} />
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                          </div>
                        )}
                      </div>

                      {/* FEMEAS SECTION */}
                      <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                          Produtoras
                        </h3>
                        <Input
                          label="Quantidade Total de Fêmeas"
                          type="number"
                          placeholder="0"
                          value={femaleQty}
                          onChange={(e) => setFemaleQty(e.target.value)}
                        />

                        {parseInt(femaleQty) > 0 && (
                          <div className="space-y-3 animate-in fade-in slide-in-from-top-2">

                            <div className="flex items-center gap-2 mb-2">
                              <input
                                type="checkbox"
                                id="splitFemales"
                                checked={splitFemales}
                                onChange={(e) => setSplitFemales(e.target.checked)}
                                className="w-4 h-4 text-pink-600"
                              />
                              <label htmlFor="splitFemales" className="text-sm font-medium text-gray-700">Separar Reprodutoras?</label>
                            </div>

                            {splitFemales && (
                              <div className="pl-4 border-l-2 border-pink-300 mb-4">
                                <Input
                                  label="Qtd. para Reprodutoras"
                                  type="number"
                                  value={femaleBreederQty}
                                  onChange={(e) => setFemaleBreederQty(e.target.value)}
                                  placeholder="0"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Restante para Postura: {(parseInt(femaleQty) || 0) - (parseInt(femaleBreederQty) || 0)}
                                </p>
                              </div>
                            )}

                            {/* DESTINATION 1: PRODUCTION FEMALES (LAYERS) */}
                            {((parseInt(femaleQty) || 0) - (splitFemales ? (parseInt(femaleBreederQty) || 0) : 0)) > 0 && (
                              <div className="bg-white p-3 rounded border border-gray-200">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Destino: Poedeiras (Postura)</p>

                                <div className="space-y-2">
                                  <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    value={femaleAviaryId}
                                    onChange={(e) => { setFemaleAviaryId(e.target.value); setFemaleGroupId(""); }}
                                  >
                                    <option value="">Selecione o Aviário...</option>
                                    {aviaries.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                  </select>

                                  <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    value={femaleGroupId}
                                    onChange={(e) => setFemaleGroupId(e.target.value)}
                                    disabled={!femaleAviaryId}
                                  >
                                    <option value="">Selecione o Grupo (Postura)...</option>
                                    {sheds?.filter(s => s.aviaryId === femaleAviaryId && s.type === 'production').map(s => (
                                      <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                  </select>

                                  <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    value={femaleCageId}
                                    onChange={(e) => setFemaleCageId(e.target.value)}
                                    disabled={!femaleGroupId}
                                  >
                                    <option value="">Selecione a Gaiola...</option>
                                    <option value="new">➕ Nova Gaiola</option>
                                    {cages.filter(c => c.status === 'active' && c.groupId === femaleGroupId).map(c => (
                                      <option key={c.id} value={c.id}>{c.name} ({c.currentQuantity}/{c.capacity})</option>
                                    ))}
                                  </select>
                                  {femaleCageId === "new" && (
                                    <div className="pl-2 border-l-2 border-pink-500 space-y-2">
                                      <Input label="Nome" value={newFemaleCageName} onChange={(e) => setNewFemaleCageName(e.target.value)} />
                                      <Input label="Capacidade" type="number" value={newFemaleCageCapacity} onChange={(e) => setNewFemaleCageCapacity(e.target.value)} />
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* DESTINATION 2: BREEDER FEMALES */}
                            {splitFemales && (parseInt(femaleBreederQty) || 0) > 0 && (
                              <div className="bg-pink-50 p-3 rounded border border-pink-200 mt-2">
                                <p className="text-xs font-bold text-pink-700 uppercase mb-2">Destino: Reprodutoras</p>

                                <div className="space-y-2">
                                  <select
                                    className="w-full px-3 py-2 border border-pink-300 rounded-md text-sm"
                                    value={femaleBreederAviaryId}
                                    onChange={(e) => { setFemaleBreederAviaryId(e.target.value); setFemaleBreederGroupId(""); }}
                                  >
                                    <option value="">Selecione o Aviário...</option>
                                    {aviaries.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                  </select>

                                  <select
                                    className="w-full px-3 py-2 border border-pink-300 rounded-md text-sm"
                                    value={femaleBreederGroupId}
                                    onChange={(e) => setFemaleBreederGroupId(e.target.value)}
                                    disabled={!femaleBreederAviaryId}
                                  >
                                    <option value="">Selecione o Grupo (Reprodutoras)...</option>
                                    {sheds?.filter(s => s.aviaryId === femaleBreederAviaryId && s.type === 'breeders').map(s => (
                                      <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                  </select>

                                  <select
                                    className="w-full px-3 py-2 border border-pink-300 rounded-md text-sm"
                                    value={femaleBreederCageId}
                                    onChange={(e) => setFemaleBreederCageId(e.target.value)}
                                    disabled={!femaleBreederGroupId}
                                  >
                                    <option value="">Selecione a Gaiola...</option>
                                    <option value="new">➕ Nova Gaiola</option>
                                    {cages.filter(c => c.status === 'active' && c.groupId === femaleBreederGroupId).map(c => (
                                      <option key={c.id} value={c.id}>{c.name} ({c.currentQuantity}/{c.capacity})</option>
                                    ))}
                                  </select>
                                  {femaleBreederCageId === "new" && (
                                    <div className="pl-2 border-l-2 border-pink-500 space-y-2">
                                      <Input label="Nome" value={newFemaleBreederCageName} onChange={(e) => setNewFemaleBreederCageName(e.target.value)} />
                                      <Input label="Capacidade" type="number" value={newFemaleBreederCageCapacity} onChange={(e) => setNewFemaleBreederCageCapacity(e.target.value)} />
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t mt-4">
                      <Button
                        variant="primary"
                        className="flex-1"
                        onClick={handleTransfer}
                        isLoading={isUpdatingGroup || isCreatingGroup}
                      >
                        Confirmar Transferência
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowTransferModal(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )
      }

      {
        isMortalityModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>Registrar Mortalidade (Caixa)</CardTitle>
                <CardDescription>
                  Ajuste o estoque da caixa de crescimento.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    label="Quantidade Morta/Abatida"
                    type="number"
                    value={mortalityQuantity}
                    onChange={(e) => setMortalityQuantity(e.target.value)}
                    placeholder="0"
                  />
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      variant="primary"
                      className="flex-1 bg-red-600 hover:bg-red-700"
                      onClick={handleRegisterMortality}
                      isLoading={isUpdatingGroup}
                      disabled={!mortalityQuantity}
                    >
                      Confirmar Perda
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setIsMortalityModalOpen(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      }

      {/* Warehouse Transfer Modal */}
      {
        isWarehouseTransferModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Transferir Pintos para Armazém</CardTitle>
                <CardDescription>Mover do lote {group.name} para o estoque de venda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Quantidade"
                  type="number"
                  value={warehouseTransferQuantity}
                  onChange={(e) => setWarehouseTransferQuantity(e.target.value)}
                  placeholder="Ex: 50"
                />

                {warehouseTransferQuantity && group && parseInt(warehouseTransferQuantity) > group.quantity && (
                  <p className="text-xs text-red-600 font-bold">
                    ⚠️ Quantidade maior que o disponível ({group.quantity}).
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={handleTransferToWarehouse}
                    disabled={!warehouseTransferQuantity || parseInt(warehouseTransferQuantity) > group?.quantity}
                  >
                    Confirmar
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setIsWarehouseTransferModalOpen(false)}>Cancelar</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      }

      {/* Climate Registration Modal - v13.0 */}
      <Modal
        isOpen={showClimateModal}
        onClose={() => setShowClimateModal(false)}
        title="Monitoramento Ambiental"
      >
        <form onSubmit={handleRegisterClimate} className="space-y-8 p-1">
          <div className="p-4 bg-blue-50/30 rounded-2xl border border-blue-100 mb-2">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 italic flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Inteligência Operacional
            </p>
            <p className="text-[11px] text-blue-700 font-bold leading-relaxed">
              Registrar o clima ajuda a IA a correlacionar quedas de postura com variações térmicas.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">Temperatura (°C)</label>
              <Input
                type="number"
                step="0.1"
                placeholder="Ex: 28.5"
                value={newClimate.temperatura}
                onChange={e => setNewClimate({ ...newClimate, temperatura: e.target.value })}
                className="h-14 bg-gray-50/50 border-gray-100 text-lg font-black tracking-tight focus:bg-white"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">Umidade (%)</label>
              <Input
                type="number"
                step="1"
                placeholder="Ex: 65"
                value={newClimate.umidade}
                onChange={e => setNewClimate({ ...newClimate, umidade: e.target.value })}
                className="h-14 bg-gray-50/50 border-gray-100 text-lg font-black tracking-tight focus:bg-white"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">Amônia (ppm) - Opcional</label>
            <Input
              type="number"
              step="0.1"
              placeholder="Ex: 10"
              value={newClimate.amonia}
              onChange={e => setNewClimate({ ...newClimate, amonia: e.target.value })}
              className="h-14 bg-gray-50/50 border-gray-100 font-bold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">Observações Gerais</label>
            <textarea
              placeholder="Ex: Ventilação ligada, granja estável"
              value={newClimate.observacoes}
              onChange={e => setNewClimate({ ...newClimate, observacoes: e.target.value })}
              className="w-full h-24 p-4 rounded-2xl border-2 border-gray-100 bg-gray-50/50 focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-medium"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full py-7 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-100 flex items-center justify-center gap-3 group"
            >
              <Wind className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Salvar Monitoramento
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
