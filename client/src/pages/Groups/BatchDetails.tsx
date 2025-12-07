import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Loading from "@/components/ui/Loading";
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
import { cagesApi } from "@/api/cages";
import { useWarehouse } from "@/hooks/useWarehouse";

export default function GroupDetails() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/batches/:id");
  const groupId = params?.id || "";

  const { batch: group, isLoading: groupLoading } = useBatchById(groupId);
  const { update: updateGroup, create: createGroup, isUpdating: isUpdatingGroup, isCreating: isCreatingGroup } = useBatches();
  const { productions } = useProduction(groupId);
  const { mortalities } = useMortality(groupId);
  const { feeds } = useFeed(groupId);
  const { sales } = useSales(groupId);

  const { cages, create: createCage } = useCages();
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
        id: groupId,
        data: {
          quantity: group.quantity - qty,
          history: newHistory
        }
      });

      setIsMortalityModalOpen(false);
      setMortalityQuantity("");
      alert("Mortalidade registrada.");
    } catch (error) {
      console.error("Erro ao registrar mortalidade:", error);
      alert("Erro ao registrar.");
    }
  };

  const handleTransfer = async () => {
    if (!group) return;

    const totalMales = parseInt(maleQty) || 0;
    const totalFemales = parseInt(femaleQty) || 0;
    const totalTransfer = totalMales + totalFemales;

    if (totalTransfer <= 0) {
      alert("Informe a quantidade de aves para transferir.");
      return;
    }

    if (totalTransfer > group.quantity) {
      alert(`Quantidade total (${totalTransfer}) excede o disponível no lote (${group.quantity}).`);
      return;
    }

    // Calculate Splits
    const malesBreeder = splitMales ? (parseInt(maleBreederQty) || 0) : 0;
    const malesProd = totalMales - malesBreeder;

    const femalesBreeder = splitFemales ? (parseInt(femaleBreederQty) || 0) : 0;
    const femalesProd = totalFemales - femalesBreeder;

    if (malesProd < 0 || malesBreeder < 0 || femalesProd < 0 || femalesBreeder < 0) {
      alert("Quantidades inválidas na divisão.");
      return;
    }

    // Validate Destinations
    // 1. Males Production
    if (malesProd > 0) {
      if (!maleCageId) return alert("Selecione uma gaiola para os Machos (Produção).");
      if (maleCageId === "new" && !newMaleCageName) return alert("Nome da nova gaiola (Machos Produção) obrigatório.");
    }
    // 2. Males Breeder
    if (malesBreeder > 0) {
      if (!maleBreederCageId) return alert("Selecione uma gaiola para os Machos (Reprodutores).");
      if (maleBreederCageId === "new" && !newMaleBreederCageName) return alert("Nome da nova gaiola (Machos Reprodutores) obrigatório.");
    }
    // 3. Females Production
    if (femalesProd > 0) {
      if (!femaleCageId) return alert("Selecione uma gaiola para as Fêmeas (Postura).");
      if (femaleCageId === "new" && !newFemaleCageName) return alert("Nome da nova gaiola (Fêmeas Postura) obrigatório.");
    }
    // 4. Females Breeder
    if (femalesBreeder > 0) {
      if (!femaleBreederCageId) return alert("Selecione uma gaiola para as Fêmeas (Reprodutoras).");
      if (femaleBreederCageId === "new" && !newFemaleBreederCageName) return alert("Nome da nova gaiola (Fêmeas Reprodutoras) obrigatório.");
    }

    try {
      const transferDate = new Date().toISOString();
      const summary: string[] = [];

      // Helper to process transfer
      const processTransfer = async (
        qty: number,
        cageId: string,
        newCageName: string,
        newCageCapacity: string,
        groupId: string,
        type: "males" | "production" | "breeders" | "postura", // Adjusted type
        label: string
      ) => {
        let finalCageId = cageId;
        if (cageId === "new") {
          const newCage = await createCage({
            name: newCageName,
            capacity: parseInt(newCageCapacity) || 50,
            status: "active",
            type: type === "postura" ? "production" : type, // Map postura to production for cage type if needed, or keep consistent
            groupId: groupId
          });
          finalCageId = newCage.id;
          summary.push(`Nova gaiola criada: ${newCage.name}`);
        }

        const targetCage = cages.find(c => c.id === finalCageId) || { name: newCageName, id: finalCageId, currentQuantity: 0 };
        const currentQty = cages.find(c => c.id === finalCageId)?.currentQuantity || 0;

        await cagesApi.update(finalCageId, {
          currentQuantity: currentQty + qty
        });

        await createGroup({
          name: `${group.name} (${label})`,
          species: group.species,
          quantity: qty,
          cageId: finalCageId,
          phase: type === "males" ? "machos" : (type === "breeders" ? "reprodutoras" : "postura"),
          originId: group.id,
          batchId: group.batchId,
          birthDate: group.birthDate,
          notes: `Transferido de ${group.cageId || "Incubação"}. Origem: ${group.name}`,
          history: [{
            date: transferDate,
            event: "Lote Criado (Transferência)",
            quantity: qty,
            details: `${label} transferidos para ${targetCage.name}`,
            origin: group.id
          }]
        });
        summary.push(`${qty} ${label} transferidos para ${targetCage.name}`);
      };

      // Execute Transfers
      if (malesProd > 0) await processTransfer(malesProd, maleCageId, newMaleCageName, newMaleCageCapacity, maleGroupId, "males", "Machos");
      if (malesBreeder > 0) await processTransfer(malesBreeder, maleBreederCageId, newMaleBreederCageName, newMaleBreederCageCapacity, maleBreederGroupId, "breeders", "Reprodutores");

      if (femalesProd > 0) await processTransfer(femalesProd, femaleCageId, newFemaleCageName, newFemaleCageCapacity, femaleGroupId, "postura", "Poedeiras");
      if (femalesBreeder > 0) await processTransfer(femalesBreeder, femaleBreederCageId, newFemaleBreederCageName, newFemaleBreederCageCapacity, femaleBreederGroupId, "breeders", "Reprodutoras");

      // Finalize Source
      await updateGroup({
        id: group.id,
        data: {
          status: "inactive",
          quantity: group.quantity - totalTransfer,
          notes: (group.notes || "") + `\n[${new Date().toLocaleDateString()}] Transferência realizada.`,
          history: [
            ...(group.history || []),
            {
              date: transferDate,
              event: "Transferência / Sexagem",
              quantity: totalTransfer,
              details: `Transferência: ${malesProd} Machos, ${malesBreeder} Reprodutores, ${femalesProd} Poedeiras, ${femalesBreeder} Reprodutoras.`,
              origin: group.id
            }
          ]
        }
      });

      setTransferSummary(summary);
      setTransferSuccess(true);

    } catch (error) {
      console.error("Erro na transferência:", error);
      alert("Erro ao realizar transferência. Verifique o console.");
    }
  };

  const handleTransferToWarehouse = async () => {
    if (!warehouseTransferQuantity || !group) return;
    const qty = parseInt(warehouseTransferQuantity);

    if (qty > group.quantity) {
      alert("Quantidade maior que o disponível no lote.");
      return;
    }

    try {
      const transferDate = new Date().toISOString();

      // 1. Add to Warehouse
      await addInventory({
        type: "chick",
        subtype: "codorna pinto",
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
          quantity: group.quantity - qty,
          history: newHistory
        }
      });

      setIsWarehouseTransferModalOpen(false);
      setWarehouseTransferQuantity("");
      alert("Transferência para o armazém realizada com sucesso!");
      window.location.reload();

    } catch (error) {
      console.error("Erro ao transferir para armazém:", error);
      alert("Erro ao transferir.");
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{group.name}</h1>
          <p className="text-muted-foreground mt-1">{group.species}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setLocation(`/batches/${groupId}/edit`)}
          >
            Editar
          </Button>
          <Button
            variant="outline"
            onClick={() => setLocation(`/batches/${groupId}/qrcode`)}
          >
            QR Code
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Quantidade</p>
            <p className="text-2xl font-bold">{formatQuantity(group.quantity)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Idade (dias)</p>
            <p className="text-2xl font-bold">{ageInDays}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="text-2xl font-bold capitalize">{group.status}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Localização</p>
            <p className="text-2xl font-bold">{cages.find(c => c.id === group.cageId)?.name || group.cageId || "N/A"}</p>
          </CardContent>
        </Card>
      </div>

      {group.phase === "crescimento" && (
        <Card className="bg-blue-50 border-blue-200 border-2 mb-6">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              📦 Painel de Controle: Caixa de Crescimento
            </CardTitle>
            <CardDescription className="text-blue-700">
              Gerenciamento do ciclo de 35 dias
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-600 uppercase">ID da Caixa</p>
              <p className="text-2xl font-bold text-blue-900">{cages.find(c => c.id === group.cageId)?.name || group.cageId || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-600 uppercase">Lote Atribuído</p>
              <p className="text-xl font-bold text-blue-900">{group.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-600 uppercase">Status</p>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${group.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                <p className="text-xl font-bold text-blue-900 uppercase">
                  {group.status === 'active' ? 'Ocupada' : 'Finalizada'}
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-600 uppercase">Idade</p>
              <p className="text-2xl font-bold text-blue-900">
                {group.status === 'active' ? `${ageInDays} dias` : 'Ciclo Encerrado'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-600 uppercase">
                {group.status === 'active' ? 'Quantidade Atual' : 'Quantidade Final'}
              </p>
              <p className="text-2xl font-bold text-blue-900">{formatQuantity(group.quantity)}</p>
            </div>

            {/* Deadline Display */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-600 uppercase">Prazo Transferência (35d)</p>
              {group.status === 'active' ? (
                <>
                  <p className={`text-xl font-bold ${ageInDays >= 35 ? "text-red-600" : "text-blue-900"}`}>
                    {(() => {
                      if (!group.birthDate) return "N/A";
                      const date = new Date(group.birthDate);
                      date.setDate(date.getDate() + 35);
                      return date.toLocaleDateString();
                    })()}
                  </p>
                  {ageInDays >= 35 && <span className="text-xs text-red-600 font-bold animate-pulse">PRAZO EXPIRADO!</span>}
                </>
              ) : (
                <p className="text-xl font-bold text-gray-500">Concluído</p>
              )}
            </div>

            <div className="flex items-end gap-2 col-span-1 md:col-span-3">
              {group.status === 'active' ? (
                <>
                  {ageInDays <= 35 && (
                    <Button
                      variant="outline"
                      className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                      onClick={() => setIsMortalityModalOpen(true)}
                    >
                      📉 Reg. Mortalidade
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    className={`flex-1 ${ageInDays >= 35 ? "bg-red-600 hover:bg-red-700 animate-pulse" : "bg-blue-600 hover:bg-blue-700"}`}
                    onClick={() => setShowTransferModal(true)}
                  >
                    {ageInDays >= 35 ? "⚠️ Transferir para Gaiola (URGENTE)" : "Transferir para Gaiola ➡️"}
                  </Button>
                </>
              ) : (
                <div className="w-full bg-gray-100 p-3 rounded text-center border border-gray-200">
                  <p className="text-gray-500 font-medium">
                    🚫 Este lote foi finalizado/transferido e não pode ser editado.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
          {group.history && group.history.length > 0 && (
            <CardContent className="border-t border-blue-100 pt-4">
              <p className="text-sm font-bold text-blue-900 mb-2">Histórico da Caixa</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {group.history.map((event, index) => (
                  <div key={index} className="text-xs flex justify-between items-center bg-white p-2 rounded border border-blue-100">
                    <div>
                      <span className="font-semibold text-blue-800">{event.event}</span>
                      <span className="text-blue-600 ml-2">{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    {event.quantity && (
                      <span className="font-mono bg-blue-50 px-1 rounded text-blue-900">
                        {event.event.includes("Mortalidade") ? "-" : ""}{event.quantity}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Data de Nascimento</p>
              <p className="font-semibold">{group.birthDate ? formatDate(group.birthDate) : "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Criado em</p>
              <p className="font-semibold">{formatDate(group.createdAt)}</p>
            </div>
            {group.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Histórico / Notas</p>
                <div className="bg-muted p-2 rounded text-xs whitespace-pre-wrap font-mono">
                  {group.notes}
                </div>
              </div>
            )}

            {group.phase !== "crescimento" && group.status === 'active' && (
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                  onClick={async () => {
                    if (confirm("Deseja configurar este grupo como uma Caixa de Crescimento?")) {
                      await updateGroup({
                        id: groupId,
                        data: { phase: "crescimento" }
                      });
                      window.location.reload();
                    }
                  }}
                >
                  📦 Configurar como Caixa de Crescimento
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estatísticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Registros de Produção</p>
              <p className="font-semibold">{productions.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Registros de Mortalidade</p>
              <p className="font-semibold">{mortalities.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Registros de Alimentação</p>
              <p className="font-semibold">{feeds.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Registros de Vendas</p>
              <p className="font-semibold">{sales.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {group.status === 'active' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {group.phase !== "crescimento" && (
            <Button
              variant="primary"
              className="w-full"
              onClick={() => setLocation(`/production?groupId=${groupId}`)}
            >
              Registrar Produção
            </Button>
          )}
          <Button
            variant="primary"
            className="w-full"
            onClick={() => setLocation(`/mortality?groupId=${groupId}`)}
          >
            Registrar Mortalidade
          </Button>
          <Button
            variant="primary"
            className="w-full"
            onClick={() => setLocation(`/feed?groupId=${groupId}`)}
          >
            Registrar Alimentação
          </Button>

          {group.phase === "crescimento" ? (
            <Button
              variant="primary"
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={() => setIsWarehouseTransferModalOpen(true)}
            >
              🏭 Transferir Pintos (Venda)
            </Button>
          ) : (
            <Button
              variant="primary"
              className="w-full"
              onClick={() => setLocation(`/sales?groupId=${groupId}`)}
            >
              Registrar Venda
            </Button>
          )}
        </div>
      )}

      {showTransferModal && (
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
                      {transferSummary.map((item, idx) => (
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
                    <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
                      <h3 className="font-bold text-lg flex items-center gap-2">
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
                            <div className="pl-4 border-l-2 border-purple-300 mb-4">
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
                            <div className="bg-purple-50 p-3 rounded border border-purple-200 mt-2">
                              <p className="text-xs font-bold text-purple-700 uppercase mb-2">Destino: Reprodutores</p>

                              <div className="space-y-2">
                                <select
                                  className="w-full px-3 py-2 border border-purple-300 rounded-md text-sm"
                                  value={maleBreederAviaryId}
                                  onChange={(e) => { setMaleBreederAviaryId(e.target.value); setMaleBreederGroupId(""); }}
                                >
                                  <option value="">Selecione o Aviário...</option>
                                  {aviaries.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>

                                <select
                                  className="w-full px-3 py-2 border border-purple-300 rounded-md text-sm"
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
                                  className="w-full px-3 py-2 border border-purple-300 rounded-md text-sm"
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
                                  <div className="pl-2 border-l-2 border-purple-500 space-y-2">
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
      )}

      {isMortalityModalOpen && (
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
      )}

      {/* Warehouse Transfer Modal */}
      {isWarehouseTransferModalOpen && (
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
      )}
    </div>
  );
}
