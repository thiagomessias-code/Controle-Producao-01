import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Loading from "@/components/ui/Loading";
import { useIncubationById, useIncubation } from "@/hooks/useIncubation";
import { useBatches } from "@/hooks/useBatches";
import { formatDate, getDaysDifference } from "@/utils/date";
import { formatQuantity } from "@/utils/format";

export default function IncubationDetails() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/incubation/:id");
  const incubationId = params?.id || "";

  const { incubation, isLoading } = useIncubationById(incubationId);
  const { update, isUpdating } = useIncubation();

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
      alert(`Erro: A quantidade eclodida (${hatchData.quantity}) não pode ser maior que o total de ovos (${incubation?.eggQuantity}).`);
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
      alert("Erro ao registrar eclosão.");
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
      alert("Por favor, identifique a caixa de destino.");
      return;
    }

    if (!realHatchQuantity) {
      alert("Por favor, informe a quantidade real de pintinhos eclodidos.");
      return;
    }

    const finalQuantity = parseInt(realHatchQuantity);

    if (finalQuantity > (incubation.eggQuantity || 0)) {
      alert(`Erro: A quantidade eclodida (${finalQuantity}) não pode ser maior que o total de ovos (${incubation.eggQuantity}).`);
      return;
    }

    const mortality = (incubation.eggQuantity || 0) - finalQuantity;

    // Removed confirm dialog as per user request. Proceeding directly.
    setIsTransferring(true);
    try {
      const transferDate = new Date().toISOString();

      // 1. Prepare Incubation History
      const incubationHistory = [
        ...(incubation?.history || []),
        {
          date: transferDate,
          event: "Eclosão Finalizada",
          quantity: finalQuantity,
          details: `Eclosão confirmada. Mortalidade: ${mortality}`,
          origin: incubation?.id
        },
        {
          date: transferDate,
          event: "Transferência para Crescimento",
          quantity: finalQuantity,
          details: `Transferido para ${targetBox}`,
          origin: incubation?.id
        }
      ];

      // 2. Prepare Growth Box History
      const groupHistory = [
        {
          date: transferDate,
          event: "Lote Criado (Transferência)",
          quantity: finalQuantity,
          details: `Origem: Incubação ${incubation?.batchNumber}. Mortalidade na eclosão: ${mortality}`,
          origin: incubation?.id
        }
      ];

      // 3. Create Growth Box (Batch)
      const newBatch = await createBatch({
        name: `Lote ${incubation?.batchNumber}`, // System generated name
        species: incubation?.species || "Codornas Japonesas",
        quantity: finalQuantity,
        cageId: targetBox, // Save the Growth Box ID as cageId
        phase: "crescimento",
        originId: incubation?.id,
        birthDate: transferDate,
        notes: incubation?.notes,
        history: groupHistory
      });

      if (newBatch && newBatch.id) {
        setCreatedBatchId(newBatch.id);
      }

      // 4. Finalize Incubation
      await update({
        id: incubationId,
        data: {
          status: "hatched",
          hatchedQuantity: finalQuantity,
          history: incubationHistory
        },
      });

      // Show success state in modal instead of alert
      setTransferSuccess(true);
    } catch (error) {
      console.error("Erro ao transferir:", error);
      alert("Erro ao criar lote de crescimento.");
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
          temperature: parseFloat(formData.temperature),
          humidity: parseFloat(formData.humidity),
          notes: formData.notes,
        },
      });
      console.log("Update successful. Status:", newStatus);

      // If status is 'hatched', do NOT redirect. Open the post-hatch modal.
      if (newStatus === "hatched") {
        console.log("Status is hatched. Opening modal...");
        // Force state update
        setIsPostHatchModalOpen(true);
      } else {
        console.log("Redirecting to list...");
        setLocation("/incubation");
      }
    } catch (err) {
      console.error("Erro ao atualizar incubação", err);
      alert("Erro ao salvar dados.");
    }
  };

  if (isLoading || !incubation) {
    return <Loading fullScreen message="Carregando incubação..." />;
  }

  const daysIncubating = getDaysDifference(new Date(incubation.startDate), new Date());
  const expectedDays = getDaysDifference(new Date(incubation.startDate), new Date(incubation.expectedHatchDate));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{incubation.batchNumber}</h1>
          <p className="text-muted-foreground mt-1">
            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 capitalize">
              {incubation.status}
            </span>
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setLocation("/incubation")}
        >
          Voltar
        </Button>
        <Button
          variant="secondary"
          onClick={() => setShowQRCode(!showQRCode)}
        >
          {showQRCode ? "Ocultar QR" : "Ver QR Code"}
        </Button>
      </div>

      {showQRCode && (
        <Card>
          <CardHeader>
            <CardTitle>QR Code da Incubação</CardTitle>
            <CardDescription>
              {incubation.batchNumber}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="bg-white p-6 rounded-lg border-2 border-primary">
              <svg
                width="200"
                height="200"
                viewBox="0 0 200 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="200" height="200" fill="white" />
                <rect x="10" y="10" width="50" height="50" fill="black" />
                <rect x="15" y="15" width="40" height="40" fill="white" />
                <rect x="20" y="20" width="30" height="30" fill="black" />
                <rect x="140" y="10" width="50" height="50" fill="black" />
                <rect x="145" y="15" width="40" height="40" fill="white" />
                <rect x="150" y="20" width="30" height="30" fill="black" />
                <rect x="10" y="140" width="50" height="50" fill="black" />
                <rect x="15" y="145" width="40" height="40" fill="white" />
                <rect x="20" y="150" width="30" height="30" fill="black" />
              </svg>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Ovos</p>
            <p className="text-2xl font-bold">{formatQuantity(incubation.eggQuantity)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Eclodiram</p>
            <p className="text-2xl font-bold">{formatQuantity(incubation.hatchedQuantity || 0)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Dias Incubando</p>
            <p className="text-2xl font-bold">{daysIncubating}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Dias Esperados</p>
            <p className="text-2xl font-bold">{expectedDays}</p>
          </CardContent>
        </Card>
      </div>

      {/* -----------------------------------------------------
           BOTÃO DE TRANSFERIR SE JÁ ECLODIU
      --------------------------------------------------------- */}
      {/* -----------------------------------------------------
           BOTÃO DE TRANSFERIR SE JÁ ECLODIU
      --------------------------------------------------------- */}
      {(() => {
        const hasTransferred = incubation.history?.some(h => h.event.includes("Transferência"));
        const isHatched = incubation.status === "hatched" || (incubation.hatchedQuantity ?? 0) > 0;

        if (isHatched && !hasTransferred) {
          return (
            <Card className="bg-green-50 border-green-200 border">
              <CardContent className="pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-green-800">Lote Eclodido 🐣</h3>
                  <p className="text-green-700">Pronto para transferir para crescimento.</p>
                  <p className="text-xs text-green-800 mt-1">
                    Status: {incubation.status} | Qtd: {incubation.hatchedQuantity}
                  </p>
                </div>
                <Button onClick={() => setIsTransferModalOpen(true)} variant="primary" className="w-full sm:w-auto">
                  Transferir ➜
                </Button>
              </CardContent>
            </Card>
          );
        }
        return null;
      })()}

      {incubation.status === "incubating" && daysIncubating >= 21 && (
        <Card className="border-2 bg-green-50 border-green-200">
          <CardContent className="pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-green-800">
                Eclosão Prevista! 🐣
              </h3>
              <p className="text-green-700">
                Este lote já completou 21 dias. Registre o nascimento e transfira para o crescimento.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Button
                variant="outline"
                onClick={openHatchModal}
                className="border-blue-200 hover:bg-blue-50 text-blue-700 flex-1 sm:flex-none"
              >
                🐣 Registrar Eclosão
              </Button>
              <Button
                variant="primary"
                onClick={() => setIsTransferModalOpen(true)}
                isLoading={isTransferring || isCreatingBatch}
                className="flex-1 sm:flex-none"
              >
                Transferir para Crescimento
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
                      <p className="text-xs text-gray-600">📍 Destino: <span className="font-bold">{targetBox || "..."}</span></p>
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

                    <div className="flex gap-2 mb-4">
                      <Button
                        variant={targetBox ? "outline" : "primary"}
                        className="flex-1"
                        onClick={() => setTargetBox("")}
                      >
                        📷 QR Code
                      </Button>
                      <Button
                        variant={targetBox ? "primary" : "outline"}
                        className="flex-1"
                        onClick={() => setTargetBox(`Caixa ${incubation?.batchNumber}`)}
                      >
                        ⌨️ Manual
                      </Button>
                    </div>

                    {!targetBox ? (
                      <div className="text-center space-y-4">
                        <div className="bg-black/10 h-32 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-400">
                          <p className="text-muted-foreground">Câmera Simulada (Scan Caixa)</p>
                        </div>
                        <Button
                          variant="secondary"
                          className="w-full"
                          onClick={() => setTargetBox("Caixa 01 (QR)")}
                        >
                          Simular Leitura QR Code
                        </Button>
                      </div>
                    ) : (
                      <Input
                        label="ID da Caixa de Crescimento"
                        placeholder="Ex: Caixa 01"
                        value={targetBox}
                        onChange={(e) => setTargetBox(e.target.value)}
                      />
                    )}

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
                    setIsTransferModalOpen(true);
                  }}
                >
                  🚀 Transferir Agora
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

      <Card>
        <CardHeader>
          <CardTitle>Histórico do Lote</CardTitle>
        </CardHeader>
        <CardContent>
          {incubation.history && incubation.history.length > 0 ? (
            <div className="space-y-4">
              {incubation.history.map((event, index) => (
                <div key={index} className="flex items-start gap-3 border-b pb-3 last:border-0">
                  <div className="bg-blue-100 p-2 rounded-full text-xs">📅</div>
                  <div>
                    <p className="font-bold text-sm">{event.event}</p>
                    <p className="text-xs text-muted-foreground">{new Date(event.date).toLocaleString()}</p>
                    {event.details && <p className="text-sm mt-1">{event.details}</p>}
                    {event.quantity && <p className="text-xs font-mono bg-gray-100 inline-block px-1 rounded mt-1">Qtd: {event.quantity}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Nenhum evento registrado.</p>
          )}
        </CardContent>
      </Card>

      {
        incubation.status !== "hatched" && (
          <Card>
            <CardHeader>
              <CardTitle>Atualizar Incubação</CardTitle>
              <CardDescription>
                Atualize os dados do lote ou registre a eclosão.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Temperatura (°C)"
                    name="temperature"
                    type="number"
                    step="0.1"
                    value={formData.temperature}
                    onChange={handleChange}
                    required
                  />
                  <Input
                    label="Umidade (%)"
                    name="humidity"
                    type="number"
                    value={formData.humidity}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Data de Eclosão Real"
                    name="actualHatchDate"
                    type="date"
                    value={formData.actualHatchDate}
                    onChange={handleChange}
                  />
                  <Input
                    label="Quantidade Eclodida"
                    name="hatchedQuantity"
                    type="number"
                    value={formData.hatchedQuantity}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notas / Observações</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange as any}
                    className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Observações sobre o processo..."
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isUpdating}
                  >
                    Salvar Alterações
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )
      }
    </div >
  );
}
