import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Loading from "@/components/ui/Loading";
import { useWarehouse } from "@/hooks/useWarehouse";
import { useGroups } from "@/hooks/useGroups";
import { formatQuantity } from "@/utils/format";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function WarehouseDashboard() {
    const [, setLocation] = useLocation();
    const { inventory, isLoading: isWarehouseLoading, processSale } = useWarehouse();
    const { groups, isLoading: isGroupsLoading } = useGroups();

    const [isAdjusting, setIsAdjusting] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [adjustData, setAdjustData] = useState({ quantity: "", type: "perda", reason: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (isWarehouseLoading || isGroupsLoading) {
        return <Loading fullScreen message="Carregando armazém..." />;
    }

    // Calculate Totals
    const totalRawEggs = inventory
        .filter(i => i.type === "egg" && i.subtype === "ovo cru" && i.status === "in_stock")
        .reduce((acc, i) => acc + i.quantity, 0);

    const totalFertilizedEggs = inventory
        .filter(i => i.type === "egg" && (i.subtype.toLowerCase().includes("fértil") || i.subtype.toLowerCase().includes("fertil")) && i.status === "in_stock")
        .reduce((acc, i) => acc + i.quantity, 0);

    const totalMeat = inventory
        .filter(i => i.type === "meat" && i.status === "in_stock")
        .reduce((acc, i) => acc + i.quantity, 0);

    // Calculate Chicks (From Inventory)
    const chicksAvailable = inventory
        .filter(i => i.type === "chick" && i.status === "in_stock")
        .reduce((acc, i) => acc + i.quantity, 0);

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100/50">
                        Controle de Inventário
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Armazém Central</h1>
                    <p className="text-gray-500 font-medium text-lg leading-relaxed">
                        Gestão estratégica de <span className="text-orange-600 font-bold">estoque e comercialização</span>.
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => window.history.back()}
                    className="rounded-xl border-orange-100 text-orange-600 hover:bg-orange-50 font-bold"
                >
                    ⬅️ Voltar
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    {
                        title: "Ovos Crus",
                        qty: totalRawEggs,
                        icon: "🥚",
                        color: "bg-orange-100/50",
                        textColor: "text-orange-600",
                        path: "/warehouse/production",
                        desc: "Consumo de Mesa"
                    },
                    {
                        title: "Ovos Férteis",
                        qty: totalFertilizedEggs,
                        icon: "🧬",
                        color: "bg-orange-100",
                        textColor: "text-orange-700",
                        path: "/warehouse/fertilized",
                        desc: "Pronto para Incubação"
                    },
                    {
                        title: "Abatimentos",
                        qty: totalMeat,
                        icon: "🍗",
                        color: "bg-red-50",
                        textColor: "text-red-600",
                        path: "/warehouse/slaughter",
                        desc: "Produtos Cárneos"
                    },
                    {
                        title: "Pintos",
                        qty: chicksAvailable,
                        icon: "🐥",
                        color: "bg-blue-50",
                        textColor: "text-blue-600",
                        path: "/warehouse/chicks",
                        desc: "Aves de 1 dia"
                    }
                ].map((item, i) => (
                    <Card
                        key={i}
                        className="hover:shadow-2xl hover:shadow-orange-200/50 transition-all duration-300 border-none relative overflow-hidden group"
                    >
                        <div
                            className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-full -mr-12 -mt-12 opacity-50 group-hover:bg-orange-100 transition-colors duration-500 cursor-pointer"
                            onClick={() => setLocation(item.path)}
                        ></div>
                        <CardHeader className="pb-2 relative z-10 cursor-pointer" onClick={() => setLocation(item.path)}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 ${item.color} ${item.textColor} rounded-xl shadow-inner group-hover:scale-110 transition-transform`}>
                                        <span className="text-xl">{item.icon}</span>
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-black text-gray-900 group-hover:text-orange-600 transition-colors">{item.title}</CardTitle>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.desc}</p>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="mt-4 cursor-pointer" onClick={() => setLocation(item.path)}>
                                <p className="text-3xl font-black text-gray-900 tabular-nums">
                                    {formatQuantity(item.qty)}
                                    <span className="text-sm font-bold text-gray-300 ml-2 uppercase">un</span>
                                </p>
                            </div>

                            <div className="pt-4 mt-4 border-t border-orange-50 flex items-center justify-between gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="flex-1 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border border-orange-100/50 hover:bg-orange-50"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedItem(item);
                                        setAdjustData({ quantity: "", type: "perda", reason: "" });
                                        setIsAdjusting(true);
                                    }}
                                >
                                    ⚠️ AJUSTAR
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="px-2 text-orange-400 group-hover:translate-x-1 transition-transform"
                                    onClick={() => setLocation(item.path)}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Modal
                isOpen={isAdjusting}
                onClose={() => setIsAdjusting(false)}
                title={`Ajuste de Estoque: ${selectedItem?.title}`}
            >
                <div className="space-y-6 pt-2">
                    <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest leading-none">Saldo Atual</p>
                            <p className="text-2xl font-black text-orange-600 tabular-nums">{formatQuantity(selectedItem?.qty || 0)} <span className="text-xs uppercase">un</span></p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Categoria</p>
                            <p className="text-sm font-bold text-gray-700">{selectedItem?.desc}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setAdjustData(prev => ({ ...prev, type: "perda" }))}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${adjustData.type === 'perda'
                                    ? 'border-red-500 bg-red-50 text-red-600'
                                    : 'border-gray-100 bg-white text-gray-400 hover:border-red-100'
                                    }`}
                            >
                                <span className="text-xl">🗑️</span>
                                <span className="text-[10px] font-black uppercase tracking-widest">Perda</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setAdjustData(prev => ({ ...prev, type: "consumo_interno" }))}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${adjustData.type === 'consumo_interno'
                                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                                    : 'border-gray-100 bg-white text-gray-400 hover:border-blue-100'
                                    }`}
                            >
                                <span className="text-xl">🍳</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-center">Consumo Interno</span>
                            </button>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Quantidade para Baixa</Label>
                            <Input
                                type="number"
                                value={adjustData.quantity}
                                onChange={(e) => setAdjustData(prev => ({ ...prev, quantity: e.target.value }))}
                                placeholder="0"
                                className="text-xl font-black py-6 rounded-2xl border-none bg-orange-50/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Justificativa / Observações</Label>
                            <Input
                                value={adjustData.reason}
                                onChange={(e) => setAdjustData(prev => ({ ...prev, reason: e.target.value }))}
                                placeholder="Descreva o motivo (opcional)"
                                className="font-bold py-4 rounded-2xl border-none bg-orange-50/50"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="outline"
                            className="flex-1 rounded-xl font-black"
                            onClick={() => setIsAdjusting(false)}
                            disabled={isSubmitting}
                        >
                            CANCELAR
                        </Button>
                        <Button
                            variant="primary"
                            className={`flex-1 rounded-xl font-black shadow-lg ${adjustData.type === 'perda' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
                            disabled={!adjustData.quantity || parseFloat(adjustData.quantity) <= 0 || isSubmitting}
                            onClick={async () => {
                                setIsSubmitting(true);
                                try {
                                    const qty = parseFloat(adjustData.quantity);
                                    if (qty > selectedItem.qty) {
                                        toast.error("Quantidade superior ao saldo em estoque!");
                                        return;
                                    }

                                    // Map title to subtype for warehouse API
                                    let type: "egg" | "meat" | "chick" = "egg";
                                    let subtype = "ovo cru";

                                    if (selectedItem.title.includes("Ovos Férteis")) {
                                        subtype = "ovo fértil";
                                    } else if (selectedItem.title.includes("Abatimentos")) {
                                        type = "meat";
                                        subtype = "Abate"; // Fuzzy matches "Abate - Codornas Japonesas"
                                    } else if (selectedItem.title.includes("Pintos")) {
                                        type = "chick";
                                        subtype = "codorna pinto"; // Fuzzy matches with suffixes
                                    }

                                    // Better mapping based on selectedItem original keys
                                    // But since we built the list manually in the component, we should probably pass the data.
                                    // For now, use titles/desc matching.

                                    await processSale(type, subtype, qty, adjustData.type);
                                    toast.success("Ajuste realizado com sucesso!");
                                    setIsAdjusting(false);
                                } catch (err: any) {
                                    toast.error(err.message || "Erro ao realizar ajuste");
                                } finally {
                                    setIsSubmitting(false);
                                }
                            }}
                        >
                            {isSubmitting ? "PROCESSANDO..." : "CONFIRMAR AJUSTE"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
