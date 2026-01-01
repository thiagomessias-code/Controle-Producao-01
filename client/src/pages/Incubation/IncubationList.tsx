import { useState } from "react";
import { useLocation } from "wouter";
import { Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Loading from "@/components/ui/Loading";
import { useIncubation } from "@/hooks/useIncubation";
import { formatDate } from "@/utils/date";
import { formatQuantity } from "@/utils/format";

export default function IncubationList() {
  const [, setLocation] = useLocation();
  const { incubations, isLoading, isDeleting, delete: deleteIncubation } = useIncubation();
  const [showHistory, setShowHistory] = useState(false);

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja deletar este registro?")) {
      deleteIncubation(id);
    }
  };

  // Filter incubations based on view mode
  const filteredIncubations = (incubations || []).filter((inc) => {
    // If showing history, show ONLY hatched/completed
    if (showHistory) {
      return inc.status === "hatched" || inc.status === "completed";
    }
    // Otherwise (default), show ONLY active (incubating)
    return inc.status === "incubating" || inc.status === "active";
  });

  if (isLoading) {
    return <Loading fullScreen message="Carregando incubações..." />;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100/50">
            Ciclo de Vida
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            {showHistory ? "Histórico de Incubação" : "Incubação de Lotes"}
          </h1>
          <p className="text-gray-500 font-medium text-lg leading-relaxed">
            {showHistory
              ? "Relatório de lotes que já <span class='text-orange-600 font-bold'>eclodiram ou foram finalizados</span>."
              : "Acompanhamento em tempo real de <span class='text-orange-600 font-bold'>temperatura, umidade e prazos</span>."}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowHistory(!showHistory)}
            className="rounded-xl border-orange-100 text-orange-600 hover:bg-orange-50 font-bold flex items-center gap-2"
          >
            {showHistory ? "Ver Lotes Ativos" : "Ver Arquivados"}
          </Button>
          <Button
            variant="primary"
            onClick={() => setLocation("/incubation/create")}
            className="rounded-xl font-black flex items-center gap-2 shadow-lg shadow-orange-200"
          >
            + Novo Lote
          </Button>
        </div>
      </div>

      {filteredIncubations.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-orange-100 rounded-[2rem] p-16 text-center">
          <div className="text-6xl mb-6 grayscale opacity-20">{showHistory ? "📜" : "🥚"}</div>
          <h3 className="text-xl font-black text-gray-900 mb-2">{showHistory ? "Sem histórico registrado" : "Nenhum lote em incubação"}</h3>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-8">
            {showHistory ? "Lotes finalizados aparecerão nesta seção" : "Inicie o processo criando um novo lote de ovos férteis"}
          </p>
          {!showHistory && (
            <Button
              variant="primary"
              onClick={() => setLocation("/incubation/create")}
              className="rounded-xl font-black px-8"
            >
              CRIAR PRIMEIRO LOTE
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIncubations.map((incubation) => (
            <Card key={incubation.id} className={`hover:shadow-2xl hover:shadow-orange-200/50 hover:-translate-y-2 transition-all duration-300 border-none relative overflow-hidden group ${incubation.status !== 'incubating' && incubation.status !== 'active' ? 'bg-gray-50/50 grayscale-[0.5]' : 'bg-white'}`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-full -mr-12 -mt-12 opacity-50 group-hover:bg-orange-100 transition-colors duration-500"></div>
              <CardHeader className="relative z-10 pb-4">
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${incubation.status === 'incubating' || incubation.status === 'active'
                    ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                    : 'bg-white text-gray-400 border-gray-100'
                    }`}>
                    {incubation.status === 'incubating' || incubation.status === 'active' ? 'Em curso' : 'Eclodido'}
                  </span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lote #{incubation.batchNumber.slice(-4)}</span>
                </div>
                <CardTitle className="text-2xl font-black text-gray-900 group-hover:text-orange-600 transition-colors uppercase tracking-tight">
                  {incubation.batchNumber}
                </CardTitle>
                <CardDescription className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Iniciado em {formatDate(incubation.startDate || incubation.createdAt)}</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-orange-50/50 p-3 rounded-2xl border border-orange-100/50">
                    <p className="text-[10px] font-black text-orange-900/40 uppercase tracking-widest mb-1">Carga Inicial</p>
                    <p className="text-xl font-black text-gray-900 tabular-nums">
                      {formatQuantity(incubation.eggQuantity)}
                      <span className="text-[10px] ml-1 text-gray-400 uppercase">ovos</span>
                    </p>
                  </div>
                  <div className="bg-green-50/50 p-3 rounded-2xl border border-green-100/50">
                    <p className="text-[10px] font-black text-green-900/40 uppercase tracking-widest mb-1">Eclosão</p>
                    <p className="text-xl font-black text-gray-900 tabular-nums">
                      {formatQuantity(incubation.hatchedQuantity || 0)}
                      <span className="text-[10px] ml-1 text-gray-400 uppercase">aves</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                    {incubation.temperature}°C Temp
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    {incubation.humidity}% UMId
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    className="flex-1 rounded-xl font-black shadow-lg shadow-orange-100"
                    onClick={() => setLocation(`/incubation/${incubation.id}`)}
                  >
                    GERENCIAR
                  </Button>
                  <button
                    onClick={() => handleDelete(incubation.id)}
                    disabled={isDeleting || (incubation.status !== 'incubating' && incubation.status !== 'active')}
                    className="p-2.5 text-gray-300 hover:text-red-500 transition-all hover:bg-red-50 rounded-xl disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Remover Lote"
                  >
                    <Trash2 className="w-5 h-5" strokeWidth={2.5} />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
