import { useState } from "react";
import { useLocation } from "wouter";
import { useFeed } from "@/hooks/useFeed";
import Button from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Archive, ArrowLeft, Loader2 } from "lucide-react";

export default function RefillSiloPage() {
    const [, setLocation] = useLocation();
    const { availableFeeds, isLoading, resupply, isResupplying } = useFeed();
    const [feedTypeId, setFeedTypeId] = useState("");
    const [quantity, setQuantity] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!feedTypeId || !quantity) return;

        try {
            const qtyNum = parseFloat(quantity);
            if (isNaN(qtyNum) || qtyNum <= 0) {
                toast.error("Quantidade inválida");
                return;
            }

            const selectedFeed = availableFeeds.find((f: any) => f.id === feedTypeId);
            if (!selectedFeed) throw new Error("Feed não encontrado");

            // Using resupply which handles history and RPC
            await resupply({
                id: feedTypeId,
                quantity: qtyNum,
                userId: 'system'
            });

            toast.success("Silo abastecido com sucesso!");
            setLocation("/");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao registrar abastecimento");
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500 font-bold">Carregando silos...</div>;

    const selectedFeed = availableFeeds.find((f: any) => f.id === feedTypeId);

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => setLocation("/")} className="rounded-xl border-blue-100 text-blue-600">
                    <ArrowLeft size={16} className="mr-2" /> Voltar
                </Button>
            </div>

            <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 -m-8 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative z-10 flex items-center gap-6">
                    <div className="p-4 bg-white/20 rounded-3xl backdrop-blur-md">
                        <Archive size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tight">Abastecer Silo</h2>
                        <p className="text-blue-100 font-medium">Reposição de ração no estoque</p>
                    </div>
                </div>
            </div>

            <Card className="border-none shadow-2xl shadow-blue-100/50 rounded-[2.5rem] overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-blue-400 to-blue-600"></div>
                <CardContent className="p-10 space-y-8">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-4">
                            <Label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Tipo de Ração</Label>
                            <select
                                value={feedTypeId}
                                onChange={(e) => setFeedTypeId(e.target.value)}
                                className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-gray-800 appearance-none"
                                required
                            >
                                <option value="">Selecione...</option>
                                {availableFeeds.map((f: any) => (
                                    <option key={f.id} value={f.id}>{f.name} ({f.phase})</option>
                                ))}
                            </select>
                        </div>

                        {selectedFeed && (
                            <div className="p-5 bg-blue-50 border border-blue-100 rounded-3xl flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Estoque Atual</p>
                                    <p className="text-2xl font-black text-blue-900">{selectedFeed.estoque_atual || 0} <span className="text-sm">kg</span></p>
                                </div>
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm font-black italic">
                                    #
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <Label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Quantidade Adicionada (kg)</Label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.01"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="w-full p-6 bg-gray-50 border-none rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 transition-all text-4xl font-black text-gray-900 tabular-nums"
                                    placeholder="0.00"
                                    required
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-gray-300 uppercase tracking-widest text-sm">KG</div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isResupplying || !feedTypeId || !quantity}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-3xl shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isResupplying ? <Loader2 className="animate-spin" /> : (
                                <>
                                    Confirmar Reposição <Archive size={20} />
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
