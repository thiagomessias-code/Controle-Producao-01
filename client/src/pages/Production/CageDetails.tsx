import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Loading from "@/components/ui/Loading";
import Input from "@/components/ui/Input";
import { useCages } from "@/hooks/useCages";
import { useGroups } from "@/hooks/useGroups";
import { computeFeedType } from "@/utils/feed";
import { formatQuantity } from "@/utils/format";
import { formatDate, formatDateTime } from "@/utils/date";
import QRCodeScanner from "@/components/ui/QRCodeScanner";

import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { feedApi, FeedType } from "@/api/feed";
import { parseQRData } from "@/utils/qr";
import { useBatches, useBatchesByCageId } from "@/hooks/useBatches";

export default function CageDetails() {
    const { user } = useAuth();
    const { id: cageId } = useParams();
    const [, setLocation] = useLocation();
    const cage = useCages().cages?.find((c: any) => c.id === cageId);
    const cageLoading = useCages().isLoading;

    const { cages, update: updateCage } = useCages();

    const { update: updateBatch, create: createBatch } = useBatches();
    const { batches, isLoading: batchesLoading, refetch: refetchBatches } = useBatchesByCageId(cageId || "");

    // All active batches in this cage
    const activeBatches = (batches || [])
        .filter((b: any) => String(b.cageId) === String(cageId) && b.status === 'active')
        .sort((a, b) => (b.quantity || 0) - (a.quantity || 0));

    // Selection for actions (defaults to the first/largest)
    const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

    useEffect(() => {
        if (activeBatches.length > 0 && !selectedBatchId) {
            setSelectedBatchId(activeBatches[0].id);
        }
    }, [activeBatches, selectedBatchId]);

    const activeGroup = activeBatches.find(b => b.id === selectedBatchId) || activeBatches[0];

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
        quantity: "",
        males: "0",
        females: "0"
    });

    const [feedTypes, setFeedTypes] = useState<FeedType[]>([]);
    const [selectedFeedTypeId, setSelectedFeedTypeId] = useState("");

    useEffect(() => {
        const fetchFeedTypes = async () => {
            try {
                const types = await feedApi.getFeedTypes();
                setFeedTypes(types);
                // Look for a sensible default or the first one
                if (types.length > 0) {
                    const defaultType = types.find(t => t.name.toLowerCase().includes(feedType.toLowerCase())) || types[0];
                    setSelectedFeedTypeId(defaultType.id);
                }
            } catch (err) {
                console.error("Error fetching feed types:", err);
            }
        };
        fetchFeedTypes();
    }, []);



    const handleQRScan = (data: string) => {
        try {
            const { id } = parseQRData(data);
            const targetCageId = id;

            if (targetCageId) {
                const targetCage = cages.find(c => String(c.id) === String(targetCageId));
                if (targetCage) {
                    setSelectedGroupId(targetCage.groupId);
                    setTransferData(prev => ({ ...prev, targetCageId: targetCage.id }));
                    setShowQRScanner(false);
                    toast.success(`Gaiola ${targetCage.name} selecionada!`);
                } else {
                    toast.error("Gaiola não encontrada.");
                }
            }
        } catch (e) {
            toast.error("QR Code inválido.");
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
            toast.error("Quantidade maior que o disponível no lote.");
            return;
        }

        if (qty <= 0) {
            toast.error("A quantidade deve ser maior que zero.");
            return;
        }

        if (targetCage.currentQuantity + qty > targetCage.capacity) {
            toast.error(`⚠️ OPERAÇÃO BLOQUEADA: A capacidade da gaiola de destino (${targetCage.name}) seria excedida.\n\nAtual: ${targetCage.currentQuantity}\nAdicionando: ${qty}\nCapacidade: ${targetCage.capacity}\nDisponível: ${targetCage.capacity - targetCage.currentQuantity}`, { duration: 5000 });
            return;
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
                    details: `Transferido para gaiola ${targetCage.name} por ${user?.name || 'Sistema'}`
                }
            ];

            const malesMoving = parseInt(transferData.males) || 0;
            const femalesMoving = parseInt(transferData.females) || 0;

            const newRemainingQty = Math.max(0, activeGroup.quantity - qty);

            await updateBatch({
                id: activeGroup.id,
                data: {
                    quantity: newRemainingQty,
                    status: newRemainingQty <= 0 ? "inactive" : "active",
                    males: Math.max(0, (activeGroup.males || 0) - malesMoving),
                    females: Math.max(0, (activeGroup.females || 0) - femalesMoving),
                    history: sourceHistory
                }
            });

            // 2. Update Source Cage (Quantity)
            await updateCage({
                id: cageId || "",
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
                        details: `Recebido da gaiola ${cage.name} por ${user?.name || 'Sistema'}`
                    }
                ];

                await updateBatch({
                    id: destBatch.id,
                    data: {
                        quantity: destBatch.quantity + qty,
                        males: (destBatch.males || 0) + malesMoving,
                        females: (destBatch.females || 0) + femalesMoving,
                        history: destHistory
                    }
                });
            } else {
                // Create new batch in destination
                await createBatch({
                    name: activeGroup.name, // Mantendo o nome original como solicitado ("seguir o número do lote")
                    species: activeGroup.species,
                    quantity: qty,
                    males: malesMoving,
                    females: femalesMoving,
                    parentId: activeGroup.id, // Rastreabilidade do lote pai
                    cageId: transferData.targetCageId,
                    phase: activeGroup.phase,
                    birthDate: activeGroup.birthDate,
                    notes: `Transferido de ${cage.name}. Origem: ${activeGroup.name}`,
                    history: [
                        {
                            date: transferDate,
                            event: "Lote Criado (Transferência)",
                            quantity: qty,
                            details: `Recebido da gaiola ${cage.name} por ${user?.name || 'Sistema'}. Lote Origem: ${activeGroup.name}`
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
            setTransferData({ targetCageId: "", quantity: "", males: "0", females: "0" });
            toast.success("Transferência realizada com sucesso!");
            refetchBatches(); // Atualizar dados locais
            window.location.reload();

        } catch (error) {
            console.error("Erro na transferência:", error);
            toast.error("Erro ao realizar transferência.");
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
            const newQty = activeGroup.quantity - qty;
            await updateBatch({
                id: activeGroup.id,
                data: {
                    quantity: Math.max(0, newQty),
                    status: newQty <= 0 ? "inactive" : "active",
                    history: newHistory
                }
            });

            // 2. Update Cage
            await updateCage({
                id: cageId || "",
                data: {
                    currentQuantity: (cage?.currentQuantity || 0) - qty
                }
            });

            setIsMortalityModalOpen(false);
            setMortalityQuantity("");
            toast.success("Mortalidade registrada.");
            refetchBatches(); // Atualizar dados locais
            window.location.reload(); // Simple reload to refresh data
        } catch (error) {
            console.error("Erro ao registrar mortalidade:", error);
            toast.error("Erro ao registrar.");
        }
    };

    const handleRegisterFeed = async () => {
        if (!activeGroup || !cage) return;
        const amountKg = parseFloat(feedAmount);
        const gramsPerBird = (amountKg * 1000) / activeGroup.quantity;

        try {
            const feedTypeObj = feedTypes.find(t => t.id === selectedFeedTypeId);
            const feedTypeName = feedTypeObj?.name || feedType;

            // 1. Create Consumption Record (Syncs with stock via trigger)
            await feedApi.create({
                groupId: cage.groupId, // Using groupId for aviary filtering in admin
                cageId: cageId,
                batchId: activeGroup.id,
                date: new Date().toISOString(),
                quantity: amountKg,
                feedTypeId: selectedFeedTypeId,
                feedTypeName: feedTypeName,
                notes: `Fornecido via Gaiola ${cage.name}. (Registrado por ${user?.name || 'Sistema'})`
            });

            // 2. Update Batch History for traceability
            const newHistory = [
                ...(activeGroup.history || []),
                {
                    date: new Date().toISOString(),
                    event: "Alimentação",
                    quantity: 0,
                    details: `Fornecido ${amountKg}kg de ração (${feedTypeName}). Consumo: ${gramsPerBird.toFixed(1)}g/ave. Registrado por ${user?.name || 'Sistema'}`
                }
            ];

            await updateBatch({
                id: activeGroup.id,
                data: {
                    history: newHistory
                }
            });

            setIsFeedModalOpen(false);
            toast.success("Alimentação registrada e estoque atualizado!");
            window.location.reload();
        } catch (error) {
            console.error("Erro ao registrar alimentação:", error);
            toast.error("Erro ao registrar no estoque.");
        }
    };

    if (cageLoading || !cage) {
        return <Loading fullScreen message="Carregando gaiola..." />;
    }



    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={() => window.history.back()}>
                        ⬅️ Voltar
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">{cage.name}</h1>
                        <p className="text-muted-foreground mt-1">Detalhes da Gaiola de Produção</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

                        {activeGroup && (
                            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100">
                                <div className="p-2 bg-blue-50 rounded-xl">
                                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Machos</p>
                                    <p className="text-xl font-black text-blue-700 tabular-nums">{activeGroup.males || 0}</p>
                                </div>
                                <div className="p-2 bg-pink-50 rounded-xl">
                                    <p className="text-[9px] font-black text-pink-600 uppercase tracking-widest">Fêmeas</p>
                                    <p className="text-xl font-black text-pink-700 tabular-nums">{activeGroup.females || 0}</p>
                                </div>
                            </div>
                        )}
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
                        {activeBatches.length > 0 ? (
                            <div className="space-y-3">
                                {activeBatches.length > 1 && (
                                    <div className="mb-2 p-2 bg-amber-50 rounded border border-amber-100 italic text-[10px] text-amber-800">
                                        ⚠️ Esta gaiola possui múltiplos lotes. Selecione um abaixo para gerenciar mortalidade/alimentação individual.
                                    </div>
                                )}
                                {activeBatches.map(batch => (
                                    <div
                                        key={batch.id}
                                        onClick={() => setSelectedBatchId(batch.id)}
                                        className={`p-3 rounded-lg border transition-all cursor-pointer ${selectedBatchId === batch.id
                                            ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200 shadow-sm'
                                            : 'border-gray-100 hover:border-blue-200'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className={`font-bold text-sm ${selectedBatchId === batch.id ? 'text-blue-700' : 'text-gray-800'}`}>
                                                    <span>{batch.name}</span>
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    <span>ID: </span><span>{batch.id.slice(0, 8)}</span><span> • </span><span>{formatDate(batch.birthDate)}</span>
                                                </p>
                                            </div>
                                            <span className="text-xs font-black text-gray-700 bg-white px-2 py-0.5 rounded-full border border-gray-100 shadow-sm">
                                                <span>{batch.quantity}</span> <span>aves</span>
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground italic">Nenhum lote ativo nesta gaiola.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {activeGroup && (
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                        variant="primary"
                        className="flex-1 bg-red-600 hover:bg-red-700 py-6 sm:py-2"
                        onClick={() => setIsMortalityModalOpen(true)}
                    >
                        💀 Mortalidade
                    </Button>
                    <Button
                        variant="primary"
                        className="flex-1 bg-amber-600 hover:bg-amber-700 py-6 sm:py-2"
                        onClick={() => setIsFeedModalOpen(true)}
                    >
                        🌾 Alimentação
                    </Button>
                    <Button
                        variant="primary"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 py-6 sm:py-2"
                        onClick={() => setIsTransferModalOpen(true)}
                    >
                        🔄 Transferir
                    </Button>
                </div>
            )}

            <Card className="border-2 border-blue-100 shadow-lg shadow-blue-50">
                <CardHeader className="bg-blue-50/50 border-b border-blue-100 pb-3">
                    <CardTitle className="text-sm font-black uppercase text-blue-700">Linha do Tempo: {activeGroup?.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="space-y-4">
                        {(activeGroup?.history || []).slice().reverse().map((event: any, index: number) => {
                            const eventKey = `${event.date}-${event.event}-${event.quantity}-${index}`;
                            return (
                                <div key={eventKey} className="flex justify-between items-start border-b border-gray-100 pb-2 last:border-0">
                                    <div>
                                        <p className="font-semibold text-sm">
                                            <span>{event.event}</span>
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            <span>{formatDateTime(event.date)}</span>
                                        </p>
                                        {event.details && (
                                            <p className="text-[11px] text-gray-600 mt-1 italic">
                                                <span>{event.details}</span>
                                            </p>
                                        )}
                                    </div>
                                    {event.quantity > 0 && (
                                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-lg font-bold">
                                            <span>{event.event.includes("Mortalidade") ? "-" : ""}</span>
                                            <span>{event.quantity}</span>
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

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
                                    value={selectedFeedTypeId}
                                    onChange={(e) => setSelectedFeedTypeId(e.target.value)}
                                    disabled={!extendFeed}
                                >
                                    {feedTypes.map(t => (
                                        <option key={t.id} value={t.id}>{t.name} (Estoque: {t.estoque_atual.toFixed(1)}kg)</option>
                                    ))}
                                    {feedTypes.length === 0 && <option value="">Carregando...</option>}
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
                                    {groups?.map((g: any) => (
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

                            <div className="grid grid-cols-3 gap-3">
                                <Input
                                    label="Total"
                                    type="number"
                                    value={transferData.quantity}
                                    onChange={(e) => setTransferData({ ...transferData, quantity: e.target.value })}
                                    placeholder="0"
                                />
                                <Input
                                    label="Machos"
                                    type="number"
                                    value={transferData.males}
                                    onChange={(e) => setTransferData({ ...transferData, males: e.target.value })}
                                />
                                <Input
                                    label="Fêmeas"
                                    type="number"
                                    value={transferData.females}
                                    onChange={(e) => setTransferData({ ...transferData, females: e.target.value })}
                                />
                            </div>

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
