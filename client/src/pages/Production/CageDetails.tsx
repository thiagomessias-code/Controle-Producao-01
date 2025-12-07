import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Loading from "@/components/ui/Loading";
import { useCages } from "@/hooks/useCages";
import { useBatches } from "@/hooks/useBatches";
import { useGroups } from "@/hooks/useGroups";
import { computeFeedType } from "@/utils/feed";

export default function CageDetails() {
    const { id: cageId } = useParams();
    const [, setLocation] = useLocation();
    const cage = useCages().cages?.find((c: any) => c.id === cageId);
    const cageLoading = useCages().isLoading;

    const { cages, update: updateCage } = useCages();

    const { batches, update: updateBatch, create: createBatch } = useBatches();

    // Find the active batch in this cage
    const activeGroup = batches?.find((b: any) => b.cageId === cageId && b.status === 'active');

    const [isMortalityModalOpen, setIsMortalityModalOpen] = useState(false);
    const [mortalityQuantity, setMortalityQuantity] = useState("");

    const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);
    const [feedAmount, setFeedAmount] = useState("0.24"); // fixed 240g in kg
    const [feedType, setFeedType] = useState("Postura");
    const [extendFeed, setExtendFeed] = useState(false);

    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const { groups } = useGroups();
    const [selectedGroupId, setSelectedGroupId] = useState("");
    const [showQRScanner, setShowQRScanner] = useState(false);

    const [transferData, setTransferData] = useState({
        targetCageId: "",
        quantity: ""
    });



    const handleQRScan = (data: string) => {
        try {
            const parsed = JSON.parse(data);
            // Assuming QR contains { cageId: "..." } or similar
            if (parsed.cageId) {
                const targetCage = cages.find(c => c.id === parsed.cageId);
                if (targetCage) {
                    setSelectedGroupId(targetCage.groupId);
                    setTransferData(prev => ({ ...prev, targetCageId: targetCage.id }));
                    setShowQRScanner(false);
                    alert(`Gaiola ${targetCage.name} selecionada via QR Code!`);
                } else {
                    alert("Gaiola não encontrada.");
                }
            }
        } catch (e) {
            alert("QR Code inválido.");
        }
    };

    // Auto‑compute feed type based on group and age
    useEffect(() => {
        if (!activeGroup) return;
        const group = groups?.find(g => g.id === selectedGroupId);
        const computed = computeFeedType(group?.type, activeGroup.birthDate, extendFeed, feedType);
        setFeedType(computed);
    }, [activeGroup, selectedGroupId, extendFeed, groups]);

    const handleTransfer = async () => {
        if (!transferData.targetCageId || !transferData.quantity || !activeGroup || !cage) return;

        const qty = parseInt(transferData.quantity);
        const targetCage = cages.find(c => c.id === transferData.targetCageId);

        if (!targetCage) return;

        if (qty > activeGroup.quantity) {
            alert("Quantidade maior que o disponível no lote.");
            return;
        }

        if (targetCage.currentQuantity + qty > targetCage.capacity) {
            if (!confirm(`⚠️ ATENÇÃO: A gaiola de destino (${targetCage.name}) excederá a capacidade! \n\nAtual: ${targetCage.currentQuantity}\nAdicionando: ${qty}\nCapacidade: ${targetCage.capacity}\n\nDeseja continuar mesmo assim?`)) {
                return;
            }
        }

        try {
            const transferDate = new Date().toISOString();

            // 1. Update Source Batch (History & Quantity)
            const sourceHistory = [
                ...(activeGroup.history || []),
                {
                    date: transferDate,
                    event: "Transferência (Saída)",
                    quantity: qty,
                    details: `Transferido para gaiola ${targetCage.name}`
                }
            ];

            await updateBatch({
                id: activeGroup.id,
                data: {
                    quantity: activeGroup.quantity - qty,
                    history: sourceHistory
                }
            });

            // 2. Update Source Cage (Quantity)
            await updateCage({
                id: cageId,
                data: {
                    currentQuantity: cage.currentQuantity - qty
                }
            });

            // 3. Handle Destination
            const destBatch = batches?.find((b: any) => b.cageId === transferData.targetCageId && b.status === 'active');

            if (destBatch) {
                // Add to existing batch
                const destHistory = [
                    ...(destBatch.history || []),
                    {
                        date: transferDate,
                        event: "Transferência (Entrada)",
                        quantity: qty,
                        details: `Recebido da gaiola ${cage.name}`
                    }
                ];

                await updateBatch({
                    id: destBatch.id,
                    data: {
                        quantity: destBatch.quantity + qty,
                        history: destHistory
                    }
                });
            } else {
                // Create new batch in destination
                await createBatch({
                    name: `${activeGroup.name} (T)`,
                    species: activeGroup.species,
                    quantity: qty,
                    cageId: transferData.targetCageId,
                    phase: activeGroup.phase,
                    birthDate: activeGroup.birthDate,
                    notes: `Transferido de ${cage.name}`,
                    history: [
                        {
                            date: transferDate,
                            event: "Lote Criado (Transferência)",
                            quantity: qty,
                            details: `Transferido da gaiola ${cage.name}`
                        }
                    ]
                });
            }

            // 4. Update Destination Cage (Quantity)
            await updateCage({
                id: transferData.targetCageId,
                data: {
                    currentQuantity: (targetCage.currentQuantity || 0) + qty
                }
            });

            setIsTransferModalOpen(false);
            setTransferData({ targetCageId: "", quantity: "" });
            alert("Transferência realizada com sucesso!");
            window.location.reload();

        } catch (error) {
            console.error("Erro na transferência:", error);
            alert("Erro ao realizar transferência.");
        }
    };

    const handleRegisterMortality = async () => {
        if (!mortalityQuantity || !activeGroup) return;
        const qty = parseInt(mortalityQuantity);

        try {
            const newHistory = [
                ...(activeGroup.history || []),
                {
                    date: new Date().toISOString(),
                    event: "Mortalidade (Gaiola)",
                    quantity: qty,
                    details: `Registrado na gaiola ${cage?.name}.`
                }
            ];

            // 1. Update Batch
            await updateBatch({
                id: activeGroup.id,
                data: {
                    quantity: activeGroup.quantity - qty,
                    history: newHistory
                }
            });

            // 2. Update Cage
            await updateCage({
                id: cageId,
                data: {
                    currentQuantity: (cage?.currentQuantity || 0) - qty
                }
            });

            setIsMortalityModalOpen(false);
            setMortalityQuantity("");
            alert("Mortalidade registrada com sucesso.");
            window.location.reload(); // Simple reload to refresh data
        } catch (error) {
            console.error("Erro ao registrar mortalidade:", error);
            alert("Erro ao registrar.");
        }
    };

    const handleRegisterFeed = async () => {
        if (!activeGroup) return;
        const amountKg = 0.24; // fixed 240g
        const gramsPerBird = (amountKg * 1000) / activeGroup.quantity;

        try {
            const newHistory = [
                ...(activeGroup.history || []),
                {
                    date: new Date().toISOString(),
                    event: "Alimentação",
                    quantity: 0, // Not a quantity change of birds
                    details: `Fornecido ${amountKg}kg de ração (${feedType}). Consumo: ${gramsPerBird.toFixed(1)}g/ave.`
                }
            ];

            // Update Batch History
            await updateBatch({
                id: activeGroup.id,
                data: {
                    history: newHistory
                }
            });

            setIsFeedModalOpen(false);
            // feedAmount remains fixed
            alert(`Alimentação registrada! Consumo estimado: ${gramsPerBird.toFixed(1)}g por ave.`);
            window.location.reload();
        } catch (error) {
            console.error("Erro ao registrar alimentação:", error);
            alert("Erro ao registrar.");
        }
    };

    if (cageLoading || !cage) {
        return <Loading fullScreen message="Carregando gaiola..." />;
    }



    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">{cage.name}</h1>
                    <p className="text-muted-foreground mt-1">Detalhes da Gaiola de Produção</p>
                </div>
                <Button variant="outline" onClick={() => setLocation("/production-management")}>
                    Voltar
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Ocupação</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-bold">{formatQuantity(cage.currentQuantity)}</span>
                            <span className="text-muted-foreground mb-1">/ {formatQuantity(cage.capacity)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 overflow-hidden">
                            <div
                                className={`h-2.5 rounded-full ${(cage.currentQuantity / cage.capacity) >= 1 ? "bg-red-500" : "bg-green-500"
                                    }`}
                                style={{ width: `${Math.min((cage.currentQuantity / cage.capacity) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase ${cage.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                            {cage.status}
                        </span>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Lote Atual</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {activeGroup ? (
                            <div>
                                <p className="font-semibold">{activeGroup.name}</p>
                                <p className="text-xs text-muted-foreground">ID: {activeGroup.id.slice(0, 8)}</p>
                                <p className="text-xs text-muted-foreground">Nasc: {formatDate(activeGroup.birthDate)}</p>
                            </div>
                        ) : (
                            <p className="text-muted-foreground italic">Nenhum lote ativo nesta gaiola.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {activeGroup && (
                <div className="flex gap-4">
                    <Button
                        variant="primary"
                        className="flex-1 bg-red-600 hover:bg-red-700"
                        onClick={() => setIsMortalityModalOpen(true)}
                    >
                        💀 Registrar Mortalidade
                    </Button>
                    <Button
                        variant="primary"
                        className="flex-1 bg-amber-600 hover:bg-amber-700"
                        onClick={() => setIsFeedModalOpen(true)}
                    >
                        🌾 Registrar Alimentação
                    </Button>
                    <Button
                        variant="primary"
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        onClick={() => setIsTransferModalOpen(true)}
                    >
                        🔄 Transferir
                    </Button>
                </div>
            )}

            {activeGroup && activeGroup.history && (
                <Card>
                    <CardHeader>
                        <CardTitle>Histórico do Lote na Gaiola</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {activeGroup.history.slice().reverse().map((event: any, index: number) => (
                                <div key={index} className="flex justify-between items-start border-b border-gray-100 pb-2 last:border-0">
                                    <div>
                                        <p className="font-semibold text-sm">{event.event}</p>
                                        <p className="text-xs text-muted-foreground">{formatDate(event.date)}</p>
                                        {event.details && <p className="text-xs text-gray-600 mt-1">{event.details}</p>}
                                    </div>
                                    {event.quantity > 0 && (
                                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                            {event.event.includes("Mortalidade") ? "-" : ""}{event.quantity}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Mortality Modal */}
            {isMortalityModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <CardHeader>
                            <CardTitle>Registrar Mortalidade</CardTitle>
                            <CardDescription>Abater aves da gaiola {cage.name}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Input
                                label="Quantidade"
                                type="number"
                                value={mortalityQuantity}
                                onChange={(e) => setMortalityQuantity(e.target.value)}
                                placeholder="0"
                            />
                            <div className="flex gap-3">
                                <Button variant="primary" className="flex-1" onClick={handleRegisterMortality}>Confirmar</Button>
                                <Button variant="outline" className="flex-1" onClick={() => setIsMortalityModalOpen(false)}>Cancelar</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Feed Modal */}
            {isFeedModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <CardHeader>
                            <CardTitle>Registrar Alimentação</CardTitle>
                            <CardDescription>Lote: {activeGroup?.name} ({activeGroup?.quantity} aves)</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Fixed feed amount (240g) */}
                            <div className="mb-2">
                                <label className="block text-sm font-medium mb-1">Quantidade (kg)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={feedAmount}
                                    readOnly
                                    className="w-full border rounded p-2 bg-gray-100 cursor-not-allowed"
                                />
                            </div>
                            {/* Extend feed toggle */}
                            <div className="flex items-center mb-2">
                                <input
                                    type="checkbox"
                                    id="extendFeed"
                                    checked={extendFeed}
                                    onChange={(e) => setExtendFeed(e.target.checked)}
                                    className="mr-2"
                                />
                                <label htmlFor="extendFeed" className="text-sm">Estender ração</label>
                            </div>
                            {/* Feed type selector */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Tipo de Ração</label>
                                <select
                                    className="w-full border rounded p-2"
                                    value={feedType}
                                    onChange={(e) => setFeedType(e.target.value)}
                                    disabled={!extendFeed}
                                >
                                    <option value="Postura">Postura</option>
                                    <option value="Crescimento">Crescimento</option>
                                    <option value="Engorda">Engorda</option>
                                </select>
                            </div>

                            {activeGroup && (
                                <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
                                    Estimativa: <strong>{((parseFloat(feedAmount) * 1000) / activeGroup.quantity).toFixed(1)}g</strong> por ave.
                                </div>
                            )}

                            <div className="flex gap-3">
                                <Button variant="primary" className="flex-1" onClick={handleRegisterFeed}>Confirmar</Button>
                                <Button variant="outline" className="flex-1" onClick={() => setIsFeedModalOpen(false)}>Cancelar</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Transfer Modal */}
            {isTransferModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <CardHeader>
                            <CardTitle>Transferir Aves</CardTitle>
                            <CardDescription>Mover do {cage.name} para outra gaiola</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium">Grupo (Galpão)</label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs py-0 h-6"
                                        onClick={() => setShowQRScanner(true)}
                                    >
                                        📷 Ler QR Code
                                    </Button>
                                </div>
                                <select
                                    className="w-full border rounded p-2 mb-3"
                                    value={selectedGroupId}
                                    onChange={(e) => {
                                        setSelectedGroupId(e.target.value);
                                        setTransferData(prev => ({ ...prev, targetCageId: "" }));
                                    }}
                                >
                                    <option value="">Selecione o Grupo...</option>
                                    {groups?.map(g => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>

                                <label className="block text-sm font-medium mb-1">Gaiola de Destino</label>
                                <select
                                    className="w-full border rounded p-2"
                                    value={transferData.targetCageId}
                                    onChange={(e) => setTransferData({ ...transferData, targetCageId: e.target.value })}
                                    disabled={!selectedGroupId}
                                >
                                    <option value="">Selecione uma gaiola...</option>
                                    {cages
                                        .filter(c => c.id !== cageId && c.groupId === selectedGroupId)
                                        .map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} ({c.currentQuantity}/{c.capacity})
                                            </option>
                                        ))}
                                </select>
                            </div>

                            {showQRScanner && (
                                <QRCodeScanner
                                    onScan={handleQRScan}
                                    onClose={() => setShowQRScanner(false)}
                                />
                            )}

                            <Input
                                label="Quantidade"
                                type="number"
                                value={transferData.quantity}
                                onChange={(e) => setTransferData({ ...transferData, quantity: e.target.value })}
                                placeholder="Ex: 10"
                            />

                            {transferData.quantity && activeGroup && parseInt(transferData.quantity) > activeGroup.quantity && (
                                <p className="text-xs text-red-600 font-bold">
                                    ⚠️ Quantidade maior que o disponível ({activeGroup.quantity}).
                                </p>
                            )}

                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="primary"
                                    className="flex-1"
                                    onClick={handleTransfer}
                                    disabled={!transferData.targetCageId || !transferData.quantity || parseInt(transferData.quantity) > activeGroup?.quantity}
                                >
                                    Confirmar
                                </Button>
                                <Button variant="outline" className="flex-1" onClick={() => setIsTransferModalOpen(false)}>Cancelar</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

        </div>
    );
}
