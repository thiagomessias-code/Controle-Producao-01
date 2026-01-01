import { Cage } from "@/api/cages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatQuantity } from "@/utils/format";
import { useLocation } from "wouter";

interface CageListProps {
    cages: Cage[];
}

export default function CageList({ cages }: CageListProps) {
    const [, setLocation] = useLocation();

    if (cages.length === 0) {
        return (
            <div className="bg-white border-2 border-dashed border-orange-100 rounded-[2rem] p-16 text-center">
                <div className="text-6xl mb-6 grayscale opacity-20">🏠</div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Nenhuma gaiola cadastrada</h3>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-8">Comece criando sua primeira unidade de alojamento</p>
                <button
                    onClick={() => { }} // This would be handled by the parent's setIsModalOpen
                    className="px-8 py-3 bg-orange-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-200 hover:scale-105 transition-transform"
                >
                    CRIAR PRIMEIRA GAIOLA
                </button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cages.map((cage) => {
                const occupancy = (cage.currentQuantity / cage.capacity) * 100;
                const isFull = occupancy >= 100;
                const isNearFull = occupancy >= 90 && !isFull;

                return (
                    <Card
                        key={cage.id}
                        className="hover:shadow-2xl hover:shadow-orange-200/50 hover:-translate-y-2 transition-all duration-300 border-none relative overflow-hidden group cursor-pointer bg-white"
                        onClick={() => setLocation(`/production/cages/${cage.id}`)}
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-full -mr-12 -mt-12 opacity-50 group-hover:bg-orange-100 transition-colors"></div>
                        <CardHeader className="p-6 pb-2 relative z-10">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-2xl font-black text-gray-900 tracking-tight uppercase group-hover:text-orange-600 transition-colors">{cage.name}</CardTitle>
                                <span
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm ${cage.status === "active"
                                            ? "bg-green-50 text-green-700 border-green-100"
                                            : cage.status === "maintenance"
                                                ? "bg-yellow-50 text-yellow-700 border-yellow-100"
                                                : "bg-gray-50 text-gray-700 border-gray-100"
                                        }`}
                                >
                                    {cage.status}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 pt-2 relative z-10">
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.15em] mb-3">
                                        <span className="text-gray-400">Taxa de Ocupação</span>
                                        <span className={`${isFull ? 'text-red-600' : 'text-orange-600'}`}>
                                            {formatQuantity(cage.currentQuantity)} <span className="text-gray-300 mx-1">/</span> {formatQuantity(cage.capacity)}
                                        </span>
                                    </div>
                                    <div className="w-full bg-orange-50/50 rounded-full h-3 overflow-hidden border border-orange-100/30 p-0.5">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ease-out ${isFull
                                                    ? "bg-gradient-to-r from-red-500 to-red-600"
                                                    : isNearFull
                                                        ? "bg-gradient-to-r from-orange-400 to-amber-500"
                                                        : "bg-gradient-to-r from-orange-500 to-orange-600"
                                                }`}
                                            style={{ width: `${Math.min(occupancy, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-orange-50">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Identificador</span>
                                        <span className="text-xs font-black text-gray-400 tabular-nums">#{cage.id.slice(0, 8).toUpperCase()}</span>
                                    </div>
                                    {isFull ? (
                                        <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-red-100 animate-pulse">
                                            CAPACIDADE ESGOTADA
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                                            Detalhes ➔
                                        </span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
