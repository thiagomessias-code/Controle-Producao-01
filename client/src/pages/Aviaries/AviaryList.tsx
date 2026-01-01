import { useState, useEffect } from "react";
import { Activity } from "lucide-react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Loading from "@/components/ui/Loading";
import { aviariesApi, Aviary } from "@/api/aviaries";
import { formatQuantity } from "@/utils/format";

export default function AviaryList() {
    const [, setLocation] = useLocation();
    const [aviaries, setAviaries] = useState<Aviary[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadAviaries = async () => {
            try {
                const data = await aviariesApi.getAll();
                setAviaries(data);
            } catch (error) {
                console.error("Failed to load aviaries", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadAviaries();
    }, []);

    if (isLoading) {
        return <Loading fullScreen message="Carregando aviários..." />;
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100/50">
                        Gestão de Espaços
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Aviários</h1>
                    <p className="text-gray-500 font-medium text-lg leading-relaxed">
                        Controle total sobre seus <span className="text-orange-600 font-bold">setores de produção</span>.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {aviaries.map((aviary) => (
                    <Card
                        key={aviary.id}
                        className="hover:shadow-2xl hover:shadow-orange-200/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer border-none relative overflow-hidden group"
                        onClick={() => setLocation(`/aviaries/${aviary.id}`)}
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:bg-orange-100 transition-colors duration-500"></div>
                        <CardHeader className="pb-4 relative z-10 border-none">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-2xl font-black text-gray-900 group-hover:text-orange-600 transition-colors">{aviary.name}</CardTitle>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">{aviary.location}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100/50 ${aviary.status === 'active'
                                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-200'
                                        : 'bg-gray-100 text-gray-400'
                                    }`}>
                                    {aviary.status === 'active' ? '● Ativo' : '○ Inativo'}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10 pt-4">
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Capacidade Ocupada</p>
                                        <p className="text-4xl font-black text-gray-900">
                                            {formatQuantity(aviary.quantity || 0)}
                                            <span className="text-sm font-bold text-gray-300 ml-2 italic">Aves</span>
                                        </p>
                                    </div>
                                    <div className="p-4 bg-orange-50 group-hover:bg-orange-600 text-orange-600 group-hover:text-white rounded-2xl transition-all duration-500 shadow-inner group-hover:shadow-lg group-hover:shadow-orange-200">
                                        <Activity className="w-8 h-8" />
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-orange-50 flex items-center justify-center gap-2">
                                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest group-hover:translate-x-1 transition-transform">Explorar Grupos Internos</span>
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
