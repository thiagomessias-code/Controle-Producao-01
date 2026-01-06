import { useState } from "react";
import { useLocation } from "wouter";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Loading from "@/components/ui/Loading";
import { useProduction } from "@/hooks/useProduction";
import { useMortality } from "@/hooks/useMortality";
import { formatDate } from "@/utils/date";
import { formatQuantity, formatWeight } from "@/utils/format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, AlertTriangle, Trash2, Plus } from "lucide-react";

export default function ProductionHistory() {
  const [location] = useLocation();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState(location === "/mortality" ? "mortality" : "production");

  const {
    productions,
    isLoading: loadingProd,
    isDeleting: deletingProd,
    delete: deleteProduction,
    error: errorProd
  } = useProduction();

  const {
    mortalities,
    isLoading: loadingMort,
    isDeleting: deletingMort,
    delete: deleteMortality,
    error: errorMort
  } = useMortality();

  const handleDeleteProduction = (id: string) => {
    if (confirm("Tem certeza que deseja deletar este registro de produção?")) {
      deleteProduction(id);
    }
  };

  const handleDeleteMortality = (id: string) => {
    if (confirm("Tem certeza que deseja deletar este registro de mortalidade?")) {
      deleteMortality(id);
    }
  };

  if (loadingProd || loadingMort) {
    return <Loading fullScreen message="Carregando histórico unificado..." />;
  }

  if (errorProd || errorMort) {
    const errObj = (errorProd || errorMort) as any;
    const backendMessage = errObj.response?.data?.message || errObj.message || "";
    const isRelationshipError = backendMessage.includes("usuario_id") || backendMessage.includes("relationship");

    return (
      <div className="p-8 text-center bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-xl font-bold text-red-800">Erro ao carregar dados</h2>
        <div className="bg-white/50 p-4 rounded mt-4 text-left border border-red-100 overflow-auto">
          <p className="text-sm font-mono text-red-900 break-words">
            <strong>Mensagem do Servidor:</strong><br />
            {backendMessage || "Erro desconhecido"}
          </p>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
          <Button
            variant="outline"
            className="border-red-300 text-red-800 hover:bg-red-100"
            onClick={() => window.location.reload()}
          >
            Tentar Novamente
          </Button>
          <Button
            variant="secondary"
            className="bg-white border-red-200 text-red-700 hover:bg-red-50"
            onClick={() => {
              alert("Por favor, copie a 'Mensagem do Servidor' acima e envie para mim.");
            }}
          >
            Como Corrigir?
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100/50">
            Monitoramento de Ativos
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Gestão de Produção</h1>
          <p className="text-gray-500 font-medium text-lg leading-relaxed">
            Controle de <span className="text-orange-600 font-bold">postura, mortalidade e saúde</span> do plantel.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setLocation("/mortality/register")}
            className="rounded-xl border-orange-100 text-orange-600 hover:bg-orange-50 font-bold flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Registrar Baixa
          </Button>
          <Button
            variant="primary"
            onClick={() => setLocation("/production/register")}
            className="rounded-xl font-black flex items-center gap-2 shadow-lg shadow-orange-200"
          >
            <Plus className="w-4 h-4" />
            Novo Registro
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="inline-flex h-14 items-center justify-center rounded-2xl bg-orange-50/50 p-1.5 text-orange-900/50 border border-orange-100/50 mb-8">
          <TabsTrigger
            value="production"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-xl px-8 py-2.5 text-sm font-black ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-lg data-[state=active]:shadow-orange-100/50 gap-2"
          >
            <ClipboardList className="w-4 h-4" />
            PRODUÇÃO DE OVOS
          </TabsTrigger>
          <TabsTrigger
            value="mortality"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-xl px-8 py-2.5 text-sm font-black ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-lg data-[state=active]:shadow-orange-100/50 gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            MORTALIDADE / ABATE
          </TabsTrigger>
        </TabsList>

        <TabsContent value="production" className="mt-0 focus-visible:outline-none">
          {productions.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-orange-100 rounded-[2rem] p-16 text-center">
              <div className="text-6xl mb-6 grayscale opacity-20">🥚</div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Sem produção registrada</h3>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-8">Comece registrando a coleta do dia</p>
              <Button
                variant="primary"
                onClick={() => setLocation("/production/register")}
                className="rounded-xl font-black px-8"
              >
                REGISTRAR AGORA
              </Button>
            </div>
          ) : (
            <Card className="border-none shadow-2xl shadow-orange-100/30 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-orange-50/30 border-b border-orange-100/50">
                      <th className="p-6 text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em]">Data</th>
                      <th className="p-6 text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em]">Quantidade</th>
                      <th className="p-6 text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em]">Tipo / Qualidade</th>
                      <th className="p-6 text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em]">Destino</th>
                      <th className="p-6 text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em]">Responsável</th>
                      <th className="p-6 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-50/50">
                    {productions.map((p) => (
                      <tr key={p.id} className="hover:bg-orange-50/30 transition-all group">
                        <td className="p-6">
                          <span className="text-sm font-black text-gray-900">{formatDateTime(p.date)}</span>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-black text-gray-900">{formatQuantity(p.quantity)}</span>
                            {p.weight && (
                              <span className="text-[10px] font-bold text-orange-400 bg-orange-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                {formatWeight(p.weight)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${p.eggType === 'fertile'
                              ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                              : 'bg-white text-orange-600 border-orange-100'
                              }`}>
                              {p.eggType === 'fertile' ? 'Fértil' : 'Mesa'}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Q {p.quality}</span>
                          </div>
                        </td>
                        <td className="p-6">
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                            {p.destination}
                          </span>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-[10px] font-black text-orange-600 border-2 border-white shadow-sm">
                              {p.userName?.[0]?.toUpperCase() || "S"}
                            </div>
                            <span className="text-xs font-bold text-gray-600">{p.userName || "Sistema"}</span>
                          </div>
                        </td>
                        <td className="p-6 text-right">
                          <button
                            onClick={() => handleDeleteProduction(p.id)}
                            className="p-2 text-gray-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-xl"
                            title="Remover Registro"
                          >
                            <Trash2 className="w-5 h-5" strokeWidth={2.5} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="mortality" className="mt-0 focus-visible:outline-none">
          {mortalities.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-orange-100 rounded-[2rem] p-16 text-center">
              <div className="text-6xl mb-6 grayscale opacity-20">⚠️</div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Nenhuma baixa recente</h3>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-8">O plantel está saudável e estável</p>
              <Button
                variant="outline"
                onClick={() => setLocation("/mortality/register")}
                className="rounded-xl border-orange-100 text-orange-600 hover:bg-orange-50 font-black px-8"
              >
                REGISTRAR BAIXA
              </Button>
            </div>
          ) : (
            <Card className="border-none shadow-2xl shadow-orange-100/30 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-orange-50/30 border-b border-orange-100/50">
                      <th className="p-6 text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em]">Data</th>
                      <th className="p-6 text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em]">Quantidade</th>
                      <th className="p-6 text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em]">Causa / Motivo</th>
                      <th className="p-6 text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em]">Responsável</th>
                      <th className="p-6 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-50/50">
                    {mortalities.map((m) => (
                      <tr key={m.id} className="hover:bg-orange-50/30 transition-all group">
                        <td className="p-6">
                          <span className="text-sm font-black text-gray-900">{formatDateTime(m.date)}</span>
                        </td>
                        <td className="p-6 text-lg font-black text-gray-900 tabular-nums">
                          {formatQuantity(m.quantity)}
                        </td>
                        <td className="p-6">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-orange-100/50 ${m.cause === 'Abate' ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-500'
                            }`}>
                            {m.cause}
                          </span>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-[10px] font-black text-orange-600 border-2 border-white shadow-sm">
                              {m.userName?.[0]?.toUpperCase() || "S"}
                            </div>
                            <span className="text-xs font-bold text-gray-600">{m.userName || "Sistema"}</span>
                          </div>
                        </td>
                        <td className="p-6 text-right">
                          <button
                            onClick={() => handleDeleteMortality(m.id)}
                            className="p-2 text-gray-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-xl"
                            title="Remover Registro"
                          >
                            <Trash2 className="w-5 h-5" strokeWidth={2.5} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
