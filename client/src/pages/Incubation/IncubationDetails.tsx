import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Loading from "@/components/ui/Loading";
import { useIncubationById, useIncubation } from "@/hooks/useIncubation";
import { useBatches } from "@/hooks/useBatches";
import { caixasApi } from "@/api/caixas"; // Updated import
import { useQuery } from "@tanstack/react-query";
import { formatDate, getDaysDifference } from "@/utils/date";
import { formatQuantity } from "@/utils/format";
import QRCodeScanner from "@/components/ui/QRCodeScanner";
import { toast } from "sonner";

export default function IncubationDetails() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/incubation/:id");
  const incubationId = params?.id || "";

  const { incubation, isLoading } = useIncubationById(incubationId);
  const { update, finalize, isUpdating, isFinalizing } = useIncubation(); // Destructure finalize

  const { data: growthBoxes = [] } = useQuery({
    queryKey: ['growthBoxes'],
    queryFn: caixasApi.getAll
  });

  const [formData, setFormData] = useState({
    status: "incubating" as "incubating" | "hatched" | "failed",
    actualHatchDate: "",
    hatchedQuantity: "",
    temperature: "",
    humidity: "",
    notes: "",
  });
  const [showQRCode, setShowQRCode] = useState(false);

  useEffect(() => {
    if (incubation) {
      setFormData({
        status: incubation.status,
        actualHatchDate: incubation.actualHatchDate || "",
        hatchedQuantity: incubation.hatchedQuantity?.toString() || "",
        temperature: incubation.temperature.toString(),
        humidity: incubation.humidity.toString(),
        notes: incubation.notes || "",
      });
    }
  }, [incubation]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const { create: createBatch, isCreating: isCreatingBatch } = useBatches();
  const [isTransferring, setIsTransferring] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isHatchModalOpen, setIsHatchModalOpen] = useState(false);
  const [isPostHatchModalOpen, setIsPostHatchModalOpen] = useState(false);

  const [hasDismissedModal, setHasDismissedModal] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [targetBox, setTargetBox] = useState("");
  const [hatchData, setHatchData] = useState({
    date: new Date().toISOString().split("T")[0],
    quantity: ""
  });

  // Auto-open modal when status is 'hatched' and not transferred
  useEffect(() => {
    if (incubation?.status === "hatched") {
      const hasTransferred = incubation.history?.some(h => h.event.includes("Transferência"));
      if (!hasTransferred && !hasDismissedModal && !isTransferModalOpen) {
        setIsPostHatchModalOpen(true);
      }
    }
  }, [incubation, hasDismissedModal, isTransferModalOpen]);

  const handleRegisterHatch = async () => {
    if (!hatchData.quantity) return;

    if (parseInt(hatchData.quantity) > (incubation?.eggQuantity || 0)) {
      toast.error(`Erro: A quantidade eclodida (${hatchData.quantity}) não pode ser maior que o total de ovos (${incubation?.eggQuantity}).`);
      return;
    }

    try {
      const historyLog = [
        ...(incubation?.history || []),
        {
          date: new Date().toISOString(),
          event: "Eclosão Registrada",
          quantity: parseInt(hatchData.quantity),
          details: `Eclosão manual em ${new Date(hatchData.date).toLocaleDateString()}`
        }
      ];

      await update({
        id: incubationId,
        data: {
          status: "hatched",
          actualHatchDate: hatchData.date,
          hatchedQuantity: parseInt(hatchData.quantity),
          eggQuantity: incubation?.eggQuantity, // Required for calculating losses (perdas)
          history: historyLog
        }
      });

      setIsHatchModalOpen(false);

      // Force modal open with a slight delay to ensure UI is ready
      setTimeout(() => {
        setIsPostHatchModalOpen(true);
      }, 100);

    } catch (error) {
      console.error("Erro ao registrar eclosão:", error);
      toast.error("Erro ao registrar eclosão.");
    }
  };

  const openHatchModal = () => {
    setHatchData({
      date: new Date().toISOString().split("T")[0],
      quantity: ""
    });
    setIsHatchModalOpen(true);
  };

  const [realHatchQuantity, setRealHatchQuantity] = useState("");

  const [transferSuccess, setTransferSuccess] = useState(false);
  const [createdBatchId, setCreatedBatchId] = useState<string | null>(null);

  // Pre-fill realHatchQuantity if available
  useEffect(() => {
    if (incubation?.hatchedQuantity) {
      setRealHatchQuantity(incubation.hatchedQuantity.toString());
    }
  }, [incubation]);

  const handleTransfer = async () => {
    if (!incubation) return;

    if (!targetBox) {
      toast.error("Por favor, identifique a caixa de destino.");
      return;
    }

    if (!realHatchQuantity) {
      toast.error("Por favor, informe a quantidade real de pintinhos eclodidos.");
      return;
    }

    const finalQuantity = parseInt(realHatchQuantity);

    if (finalQuantity > (incubation.eggQuantity || 0)) {
      toast.error(`Erro: A quantidade eclodida (${finalQuantity}) não pode ser maior que o total de ovos (${incubation.eggQuantity}).`);
      return;
    }

    const mortality = (incubation.eggQuantity || 0) - finalQuantity;

    // Confirm transfer
    setIsTransferring(true);
    try {
      // Backend automatically creates the Batch when we call finalize
      const result = await finalize({
        id: incubationId,
        data: {
          actualHatchDate: new Date().toISOString(),
          hatchedQuantity: finalQuantity,
          eggQuantity: incubation.eggQuantity,
          notes: incubation.notes,
          caixa_id: targetBox // Validated above
        }
      });

      if (result && result.lote_id) {
        setCreatedBatchId(result.lote_id);
      }

      // Show success state in modal
      setTransferSuccess(true);
    } catch (error) {
      console.error("Erro ao transferir:", error);
      alert("Erro ao finalizar e criar lote de crescimento.");
    } finally {
      setIsTransferring(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting form...", formData);

    // Auto-detect status change
    let newStatus = formData.status;
    if (formData.hatchedQuantity && parseInt(formData.hatchedQuantity) > 0) {
      newStatus = "hatched";
    }

    try {
      await update({
        id: incubationId,
        data: {
          status: newStatus,
          actualHatchDate: formData.actualHatchDate,
          hatchedQuantity: formData.hatchedQuantity ? parseInt(formData.hatchedQuantity) : undefined,
          eggQuantity: incubation?.eggQuantity, // Required for calculating losses (perdas)
          temperature: parseFloat(formData.temperature),
          humidity: parseFloat(formData.humidity),
          notes: formData.notes,
        },
      });
      console.log("Update successful. Status:", newStatus);

      // If status is 'hatched', do NOT redirect. Open the post-hatch modal.
      // If status is 'hatched', redirect to Growth Boxes as the batch is created.
      // If status is 'hatched', prompt for transfer instead of redirecting
      if (newStatus === "hatched") {
        console.log("Status is hatched. prompting for transfer...");
        setIsPostHatchModalOpen(true);
      } else {
        // Only redirect if NOT hatched (e.g. just saving notes on active incubation)
        // Or stay on page? Let's stay on page to allow further edits, or redirect if user wants.
        // User behavior usually expects "Save" -> "Done".
        // But for consistency let's just alert success.
        toast.success("Dados atualizados com sucesso!");
      }
    } catch (err) {
      console.error("Erro ao atualizar incubação", err);
      toast.error("Erro ao salvar dados.");
    }
  };

  if (isLoading || !incubation) {
    return <Loading fullScreen message="Carregando incubação..." />;
  }

  const daysIncubating = getDaysDifference(new Date(incubation.startDate), new Date());
  const expectedDays = getDaysDifference(new Date(incubation.startDate), new Date(incubation.expectedHatchDate));

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-lg bg-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-widest border border-orange-200 shadow-sm animate-pulse">
              Processo de Incubação
            </span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            Lote {incubation.batchNumber}
          </h1>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            Estado Atual: <span className="text-orange-600 font-black">{incubation.status === 'incubating' ? 'EM DESENVOLVIMENTO' : incubation.status.toUpperCase()}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="rounded-xl font-black text-[10px] uppercase tracking-widest px-6 py-4 hover:bg-orange-50 transition-all border-orange-100 text-orange-600"
            onClick={() => window.history.back()}
          >
            ⬅ Voltar
          </Button>
          <Button
            variant="secondary"
            className="rounded-xl font-black text-[10px] uppercase tracking-widest px-6 py-4 hover:bg-orange-50 transition-all border-none shadow-lg"
            onClick={() => setShowQRCode(!showQRCode)}
          >
            {showQRCode ? "Ocultar Identificador" : "Gerar QR Code"}
          </Button>
        </div>
      </div>

      {showQRCode && (
        <Card className="border-none shadow-2xl shadow-orange-100/30 overflow-hidden rounded-[2rem] bg-white group animate-in zoom-in-95 duration-300">
          <div className="h-2 bg-gradient-to-r from-orange-400 to-orange-600" />
          <CardHeader className="p-8 pb-4 text-center">
            <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Identificação Digital</CardTitle>
            <CardDescription className="text-xs font-bold text-orange-600 uppercase tracking-widest mt-1">Escaneie para acesso operacional rápido</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-8 pt-0">
            <div className="bg-white p-8 rounded-[2rem] border-4 border-orange-50 shadow-inner group-hover:scale-105 transition-transform duration-500">
              <svg
                width="160"
                height="160"
                viewBox="0 0 200 200"
                fill="none"
                className="text-orange-600"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="200" height="200" fill="white" />
                <rect x="10" y="10" width="50" height="50" fill="currentColor" />
                <rect x="15" y="15" width="40" height="40" fill="white" />
                <rect x="20" y="20" width="30" height="30" fill="currentColor" />
                <rect x="140" y="10" width="50" height="50" fill="currentColor" />
                <rect x="145" y="15" width="40" height="40" fill="white" />
                <rect x="150" y="20" width="30" height="30" fill="currentColor" />
                <rect x="10" y="140" width="50" height="50" fill="currentColor" />
                <rect x="15" y="145" width="40" height="40" fill="white" />
                <rect x="20" y="150" width="30" height="30" fill="currentColor" />
                <rect x="80" y="80" width="40" height="40" fill="currentColor" opacity="0.1" />
              </svg>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Ovos em Processo", value: formatQuantity(incubation.eggQuantity), icon: "🥚", desc: "Carga inicial do lote" },
          { label: "Nascimentos", value: formatQuantity(incubation.hatchedQuantity || 0), icon: "🐥", desc: "Performance de eclosão" },
          { label: "Tempo Atual", value: `${daysIncubating} dias`, icon: "⏳", desc: "Duração do ciclo" },
          { label: "Horizonte", value: `${expectedDays} dias`, icon: "📅", desc: "Previsão estimada" }
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-xl shadow-orange-100/30 overflow-hidden rounded-[2rem] bg-white group hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="text-4xl">{stat.icon}</span>
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-gray-900 tabular-nums mb-1 group-hover:text-orange-600 transition-colors uppercase tracking-tight">
                {stat.value}
              </p>
              <p className="text-[9px] font-bold text-orange-600/50 uppercase tracking-widest">{stat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Banners */}
      {(() => {
        const hasTransferred = incubation.history?.some(h => h.event.includes("Transferência"));
        const isHatched = incubation.status === "hatched" || (incubation.hatchedQuantity ?? 0) > 0;

        if (isHatched && !hasTransferred) {
          return (
            <Card className="border-none shadow-2xl shadow-green-100/50 overflow-hidden rounded-[2.5rem] bg-green-600 group animate-in slide-in-from-bottom-4 duration-500">
              <CardContent className="p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl animate-bounce backdrop-blur-sm">
                    🚀
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">Eclosão Finalizada</h3>
                    <p className="text-green-50 font-bold uppercase text-[10px] tracking-widest mt-1 opacity-80">
                      Transferência imediata para recria necessária
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setIsTransferModalOpen(true)}
                  variant="primary"
                  className="w-full md:w-auto px-10 py-6 rounded-2xl bg-white text-green-700 hover:bg-green-50 font-black text-sm uppercase tracking-widest shadow-xl shadow-green-900/20"
                >
                  Transferir para Recria ➔
                </Button>
              </CardContent>
            </Card>
          );
        }
        return null;
      })()}

      {incubation.status === "incubating" && daysIncubating >= 21 && (
        <Card className="border-none shadow-2xl shadow-orange-100/50 overflow-hidden rounded-[2.5rem] bg-orange-600 group animate-in slide-in-from-bottom-4 duration-500">
          <CardContent className="p-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl animate-pulse backdrop-blur-sm">
                🐣
              </div>
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Momento da Eclosão</h3>
                <p className="text-orange-50 font-bold uppercase text-[10px] tracking-widest mt-1 opacity-80">
                  O ciclo de {daysIncubating} dias foi completado com sucesso
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Button
                variant="outline"
                onClick={openHatchModal}
                className="bg-white/10 border-white/20 text-white hover:bg-white hover:text-orange-600 font-black text-xs uppercase tracking-widest px-8 rounded-2xl backdrop-blur-sm transition-all"
              >
                🐣 Registrar Eclosão
              </Button>
              <Button
                variant="primary"
                onClick={() => setIsTransferModalOpen(true)}
                isLoading={isTransferring || isCreatingBatch}
                className="bg-white text-orange-600 hover:bg-orange-50 font-black text-xs uppercase tracking-widest px-8 rounded-2xl shadow-xl shadow-orange-900/20 transition-all"
              >
                Movimentar Lote ➔
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {
        isHatchModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>Registrar Eclosão</CardTitle>
                <CardDescription>
                  Informe os dados da eclosão para finalizar a incubação.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleRegisterHatch();
                }} className="space-y-4">
                  <Input
                    label="Data da Eclosão"
                    type="date"
                    value={hatchData.date}
                    onChange={(e) => setHatchData({ ...hatchData, date: e.target.value })}
                    required
                  />
                  <Input
                    label="Quantidade Eclodida"
                    type="number"
                    value={hatchData.quantity}
                    onChange={(e) => setHatchData({ ...hatchData, quantity: e.target.value })}
                    required
                    className={parseInt(hatchData.quantity) > (incubation?.eggQuantity || 0) ? "border-red-500 focus:ring-red-500" : ""}
                  />
                  {parseInt(hatchData.quantity) > (incubation?.eggQuantity || 0) && (
                    <p className="text-xs text-red-600 font-bold mt-1">
                      ⚠️ Erro: Quantidade maior que o total de ovos ({incubation?.eggQuantity}).
                    </p>
                  )}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      type="submit"
                      variant="primary"
                      className="flex-1"
                      isLoading={isUpdating}
                      disabled={!hatchData.quantity || parseInt(hatchData.quantity) > (incubation?.eggQuantity || 0)}
                    >
                      Confirmar Eclosão
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => setIsHatchModalOpen(false)}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )
      }

      {
        isTransferModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>{transferSuccess ? "Sucesso! 🎉" : "Transferir para Caixa de Crescimento"}</CardTitle>
                <CardDescription>
                  {transferSuccess
                    ? "Lote transferido e histórico atualizado."
                    : "Confirme os dados finais para transferência."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">

                {transferSuccess ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
                      <p className="text-green-800 font-medium">Transferência realizada com sucesso!</p>
                      <p className="text-sm text-green-700 mt-1">Lote movido para histórico.</p>
                    </div>
                    <Button
                      variant="primary"
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        setIsTransferModalOpen(false);
                        setTransferSuccess(false);
                        // Redirect to the newly created batch if available, otherwise to the list
                        // We need to capture the ID from the creation step first.
                        // Since we can't easily get the ID here because it was created in handleTransfer which is already done,
                        // we need to modify handleTransfer to store the ID in a state or just redirect THERE.
                        // However, handleTransfer is async and sets success state.
                        // Let's modify handleTransfer to set a 'createdBatchId' state.
                        if (createdBatchId) {
                          setLocation(`/batches/${createdBatchId}`);
                        } else {
                          setLocation("/batches/growth");
                        }
                      }}
                    >
                      OK, Ir para Caixas
                    </Button>
                  </div>
                ) : (
                  <>


                    {/* Resumo Dinâmico */}
                    <div className="bg-gray-50 p-3 rounded-md border border-gray-200 space-y-1">
                      <p className="text-sm font-medium text-gray-700">Resumo da Operação:</p>
                      <p className="text-xs text-gray-600">🐣 Novo Lote: <span className="font-bold">Lote {incubation?.batchNumber}</span></p>
                      <p className="text-xs text-gray-600">📊 Quantidade: <span className="font-bold">{realHatchQuantity || 0} aves</span></p>
                      <p className="text-xs text-gray-600">💀 Mortalidade: <span className="font-bold">{(incubation?.eggQuantity || 0) - (parseInt(realHatchQuantity) || 0)}</span></p>
                      <p className="text-xs text-gray-600">📍 Destino: <span className="font-bold">{targetBox ? growthBoxes.find(c => c.id === targetBox)?.name : "..."}</span></p>
                    </div>

                    <Input
                      label="Quantidade Real Eclodida (Vivos)"
                      type="number"
                      value={realHatchQuantity}
                      onChange={(e) => setRealHatchQuantity(e.target.value)}
                      placeholder="Ex: 45"
                      required
                      className={parseInt(realHatchQuantity) > (incubation?.eggQuantity || 0) ? "border-red-500 focus:ring-red-500" : ""}
                    />
                    {parseInt(realHatchQuantity) > (incubation?.eggQuantity || 0) && (
                      <p className="text-xs text-red-600 font-bold mt-1">
                        ⚠️ Erro: Quantidade maior que o total de ovos ({incubation?.eggQuantity}).
                      </p>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Caixa de Destino</label>
                      <select
                        className="w-full px-3 py-2 border rounded-md"
                        value={targetBox}
                        onChange={(e) => setTargetBox(e.target.value)}
                      >
                        <option value="">Selecione a Caixa...</option>
                        {growthBoxes.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.capacity} cap.)</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Selecione onde os filhotes serão alojados.</p>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        variant="primary"
                        className="flex-1"
                        onClick={handleTransfer}
                        isLoading={isTransferring || isCreatingBatch}
                        disabled={!targetBox || !realHatchQuantity || parseInt(realHatchQuantity) > (incubation?.eggQuantity || 0)}
                      >
                        Confirmar Transferência
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setIsTransferModalOpen(false)}
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

      {isPostHatchModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 bg-white">
            <CardHeader>
              <CardTitle className="text-green-700 flex items-center gap-2">
                ✅ Eclosão Registrada!
              </CardTitle>
              <CardDescription>
                O lote foi atualizado com sucesso. O que deseja fazer agora?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Os animais recém-nascidos devem ser transferidos para uma caixa de crescimento.
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  variant="primary"
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setIsPostHatchModalOpen(false);
                    // Open Scanner first
                    setIsScannerOpen(true);
                  }}
                >
                  🚀 Transferir Agora (Scanner)
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setIsPostHatchModalOpen(false);
                    setHasDismissedModal(true);
                  }}
                >
                  Fazer isso mais tarde
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-none shadow-xl shadow-orange-100/30 overflow-hidden rounded-[2rem] bg-white group hover:shadow-2xl transition-all duration-300">
        <CardHeader className="p-8 pb-4">
          <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Histórico do Lote</CardTitle>
          <CardDescription className="text-xs font-bold text-orange-600 uppercase tracking-widest mt-1">Rastreabilidade completa de eventos</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          {incubation.history && incubation.history.length > 0 ? (
            <div className="space-y-4">
              {incubation.history.map((event, index) => (
                <div key={index} className="flex items-start gap-4 p-4 rounded-2xl bg-orange-50/20 border border-orange-100/30 hover:bg-white hover:shadow-md transition-all group/event">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-lg shadow-sm group-hover/event:bg-orange-600 group-hover/event:text-white transition-colors">
                    📅
                  </div>
                  <div>
                    <p className="font-black text-gray-900 uppercase text-xs tracking-tight">{event.event}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{new Date(event.date).toLocaleString()}</p>
                    {event.details && <p className="text-xs font-medium text-gray-600 mt-2 leading-relaxed">{event.details}</p>}
                    {event.quantity && (
                      <div className="mt-2 inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-orange-50 border border-orange-100">
                        <span className="text-[9px] font-black text-orange-600 uppercase tracking-tighter">Qtd: {event.quantity}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center rounded-[2rem] border-2 border-dashed border-orange-50">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-relaxed">Nenhum evento crítico registrado para este ciclo até o momento.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {
        incubation.status !== "hatched" && (
          <Card className="border-none shadow-xl shadow-orange-100/30 overflow-hidden rounded-[2rem] bg-white group hover:shadow-2xl transition-all duration-300">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Parâmetros de Controle</CardTitle>
              <CardDescription className="text-xs font-bold text-orange-600 uppercase tracking-widest mt-1">Ajuste técnico do ambiente de incubação</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-orange-600/50 uppercase tracking-widest px-1">Temperatura (°C)</label>
                    <Input
                      name="temperature"
                      type="number"
                      step="0.1"
                      value={formData.temperature}
                      onChange={handleChange}
                      required
                      className="rounded-xl py-6 font-black text-sm tabular-nums"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-orange-600/50 uppercase tracking-widest px-1">Umidade (%)</label>
                    <Input
                      name="humidity"
                      type="number"
                      value={formData.humidity}
                      onChange={handleChange}
                      required
                      className="rounded-xl py-6 font-black text-sm tabular-nums"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-orange-600/50 uppercase tracking-widest px-1">Eclosão Efetiva</label>
                    <Input
                      name="actualHatchDate"
                      type="date"
                      value={formData.actualHatchDate}
                      onChange={handleChange}
                      className="rounded-xl py-6 font-black text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-orange-600/50 uppercase tracking-widest px-1">Saldo de Nascimentos</label>
                    <Input
                      name="hatchedQuantity"
                      type="number"
                      value={formData.hatchedQuantity}
                      onChange={handleChange}
                      className="rounded-xl py-6 font-black text-sm tabular-nums"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-orange-600/50 uppercase tracking-widest px-1">Observações Técnicas</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange as any}
                    className="w-full min-h-[120px] p-4 rounded-2xl border border-gray-100 bg-gray-50/50 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all placeholder:text-gray-300"
                    placeholder="Descreva particularidades observadas..."
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isUpdating}
                    className="rounded-xl px-12 py-6 font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-200"
                  >
                    Salvar Parâmetros 💾
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )
      }

      {/* MODALS MODERNIZATION */}
      {isHatchModalOpen && (
        <div className="fixed inset-0 bg-orange-950/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-md border-none shadow-2xl overflow-hidden rounded-[2.5rem] bg-white">
            <div className="h-3 bg-gradient-to-r from-orange-400 to-orange-600" />
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-3xl font-black text-gray-900 tracking-tight">Reg. Eclosão 🐣</CardTitle>
              <CardDescription className="text-xs font-bold text-orange-600 uppercase tracking-widest mt-1">Informe os dados finais desta carga</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              <form onSubmit={(e) => {
                e.preventDefault();
                handleRegisterHatch();
              }} className="space-y-6">
                <Input
                  label="Data do Evento"
                  type="date"
                  value={hatchData.date}
                  onChange={(e) => setHatchData({ ...hatchData, date: e.target.value })}
                  required
                  className="rounded-xl py-6 font-black text-sm"
                />
                <Input
                  label="Aves Vivas"
                  type="number"
                  value={hatchData.quantity}
                  onChange={(e) => setHatchData({ ...hatchData, quantity: e.target.value })}
                  required
                  className={`rounded-xl py-6 font-black text-sm tabular-nums ${parseInt(hatchData.quantity) > (incubation?.eggQuantity || 0) ? "border-red-500 ring-2 ring-red-100" : ""}`}
                />
                {parseInt(hatchData.quantity) > (incubation?.eggQuantity || 0) && (
                  <p className="text-[10px] text-red-600 font-black uppercase tracking-widest animate-pulse">
                    ⚠️ Erro: Quantidade excede o total ({incubation?.eggQuantity}).
                  </p>
                )}
                <div className="flex gap-4 pt-4">
                  <Button variant="outline" className="flex-1 rounded-xl py-4 font-black text-[10px] uppercase tracking-widest border-orange-100 text-orange-600" onClick={() => setIsHatchModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1 rounded-xl py-4 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-200"
                    isLoading={isUpdating}
                    disabled={!hatchData.quantity || parseInt(hatchData.quantity) > (incubation?.eggQuantity || 0)}
                  >
                    Confirmar ➔
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-orange-950/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-lg border-none shadow-2xl overflow-hidden rounded-[2.5rem] bg-white max-h-[90vh] overflow-y-auto">
            <div className="h-3 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 shadow-lg" />
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-3xl font-black text-gray-900 tracking-tight">{transferSuccess ? "Sucesso! 🎉" : "Expedição para Recria"}</CardTitle>
              <CardDescription className="text-xs font-bold text-orange-600 uppercase tracking-widest mt-1">
                {transferSuccess
                  ? "A transferência operacional foi concluída"
                  : "Alojamento técnico em caixas de crescimento"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-6">
              {transferSuccess ? (
                <div className="space-y-6 text-center">
                  <div className="bg-green-50 p-6 rounded-[2rem] border border-green-100">
                    <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🏆</div>
                    <p className="text-green-800 font-black uppercase text-xs tracking-widest">Procedimento OK</p>
                    <p className="text-[10px] text-green-700 font-bold uppercase tracking-widest mt-1 opacity-60">Novo lote ativo na unidade de recria</p>
                  </div>
                  <Button
                    variant="primary"
                    className="w-full py-6 rounded-2xl bg-green-600 hover:bg-green-700 font-black text-xs uppercase tracking-widest shadow-xl shadow-green-200"
                    onClick={() => {
                      setIsTransferModalOpen(false);
                      setTransferSuccess(false);
                      if (createdBatchId) setLocation(`/batches/${createdBatchId}`);
                      else setLocation("/batches/growth");
                    }}
                  >
                    Finalizar e Acompanhar ➔
                  </Button>
                </div>
              ) : (
                <>
                  <div className="bg-orange-50/50 p-6 rounded-[2rem] border border-orange-100/30 space-y-3">
                    <p className="text-[10px] font-black text-orange-600/50 uppercase tracking-[0.2em] mb-2 px-1">Resumo Operacional</p>
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pintos em Lote</span>
                      <span className="text-sm font-black text-gray-900 tabular-nums">{realHatchQuantity || 0}</span>
                    </div>
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Saldo de Mortalidade</span>
                      <span className="text-sm font-black text-red-600 tabular-nums">{(incubation?.eggQuantity || 0) - (parseInt(realHatchQuantity) || 0)}</span>
                    </div>
                    <div className="pt-3 border-t border-orange-100/30 flex justify-between items-center px-1">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Caixa Alvo</span>
                      <span className="text-sm font-black text-orange-600 uppercase tracking-tighter">{targetBox ? growthBoxes.find(c => c.id === targetBox)?.name : "- - -"}</span>
                    </div>
                  </div>

                  <Input
                    label="Saldo Efetivo (Aves Vivas)"
                    type="number"
                    value={realHatchQuantity}
                    onChange={(e) => setRealHatchQuantity(e.target.value)}
                    placeholder="Quantidade conferida"
                    required
                    className={`rounded-xl py-6 font-black text-sm tabular-nums ${parseInt(realHatchQuantity) > (incubation?.eggQuantity || 0) ? "border-red-500 ring-2 ring-red-100" : ""}`}
                  />

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-orange-600/50 uppercase tracking-widest px-1">Selecione o Destino</label>
                    <select
                      className="w-full px-4 py-4 rounded-xl border border-gray-100 bg-gray-50/50 text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                      value={targetBox}
                      onChange={(e) => setTargetBox(e.target.value)}
                    >
                      <option value="">C. Crescimento...</option>
                      {growthBoxes.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.capacity} cap.)</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button variant="outline" className="flex-1 rounded-xl py-4 font-black text-[10px] uppercase tracking-widest border-orange-100 text-orange-600" onClick={() => setIsTransferModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button
                      variant="primary"
                      className="flex-1 rounded-xl py-4 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-200"
                      onClick={handleTransfer}
                      isLoading={isTransferring}
                      disabled={!targetBox || !realHatchQuantity || parseInt(realHatchQuantity) > (incubation?.eggQuantity || 0)}
                    >
                      Confirmar Envio ➔
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {isPostHatchModalOpen && (
        <div className="fixed inset-0 bg-orange-950/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-md border-none shadow-2xl overflow-hidden rounded-[2.5rem] bg-white">
            <div className="h-3 bg-gradient-to-r from-green-400 to-green-600" />
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                Eclosão OK! ✅
              </CardTitle>
              <CardDescription className="text-[10px] font-bold text-green-600 uppercase tracking-widest mt-1">
                Lote finalizado com sucesso
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-6">
              <p className="text-sm font-medium text-gray-600 leading-relaxed">
                As aves nascidas estão prontas para o alojamento. O que deseja fazer agora?
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  variant="primary"
                  className="w-full py-6 rounded-2xl bg-green-600 hover:bg-green-700 font-black text-xs uppercase tracking-widest shadow-xl shadow-green-200"
                  onClick={() => {
                    setIsPostHatchModalOpen(false);
                    setIsScannerOpen(true);
                  }}
                >
                  🚀 Expedição Imediata
                </Button>
                <Button
                  variant="outline"
                  className="w-full py-6 rounded-2xl border-orange-100 text-orange-600 font-black text-[10px] uppercase tracking-widest"
                  onClick={() => {
                    setIsPostHatchModalOpen(false);
                    setHasDismissedModal(true);
                  }}
                >
                  Continuar depois
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isScannerOpen && (
        <QRCodeScanner
          onScan={(data) => {
            let scannedId = data;
            try {
              const parsed = JSON.parse(data);
              if (parsed.id) scannedId = parsed.id;
            } catch (e) { }
            const box = growthBoxes.find(b => b.id === scannedId || b.id === data);
            if (box) {
              setTargetBox(box.id);
              setIsScannerOpen(false);
              setIsTransferModalOpen(true);
            } else {
              alert("Caixa não reconhecida pelo sistema.");
              setIsScannerOpen(false);
              setIsTransferModalOpen(true);
            }
          }}
          onClose={() => {
            setIsScannerOpen(false);
            setIsTransferModalOpen(true);
          }}
          mockResult={growthBoxes.length > 0 ? growthBoxes[0].id : undefined}
          title="Leitura QR da Caixa"
        />
      )}
    </div >
  );
}
