import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Loading from "@/components/ui/Loading";
import { useWarehouse } from "@/hooks/useWarehouse";
import { useGroups } from "@/hooks/useGroups";
import { formatQuantity } from "@/utils/format";

export default function WarehouseDashboard() {
    const [, setLocation] = useLocation();
    const { inventory, isLoading: isWarehouseLoading } = useWarehouse();
    const { groups, isLoading: isGroupsLoading } = useGroups();

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
                        className="cursor-pointer hover:shadow-2xl hover:shadow-orange-200/50 hover:-translate-y-2 transition-all duration-300 border-none relative overflow-hidden group"
                        onClick={() => setLocation(item.path)}
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-full -mr-12 -mt-12 opacity-50 group-hover:bg-orange-100 transition-colors duration-500"></div>
                        <CardHeader className="pb-2 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 ${item.color} ${item.textColor} rounded-xl shadow-inner group-hover:scale-110 transition-transform`}>
                                    <span className="text-xl">{item.icon}</span>
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-black text-gray-900 group-hover:text-orange-600 transition-colors">{item.title}</CardTitle>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.desc}</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="mt-4">
                                <p className="text-3xl font-black text-gray-900 tabular-nums">
                                    {formatQuantity(item.qty)}
                                    <span className="text-sm font-bold text-gray-300 ml-2 uppercase">un</span>
                                </p>
                                <div className="pt-4 mt-4 border-t border-orange-50 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest group-hover:translate-x-1 transition-transform">Ver Estoque Detalhado</span>
                                    <svg className="w-4 h-4 text-orange-400 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
