import { useState } from "react";
import { useLocation } from "wouter";
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {showHistory ? "Histórico de Incubação 📜" : "Incubação 🥚"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {showHistory
              ? "Visualize lotes eclodidos e finalizados"
              : "Gerencie seus lotes em processo de incubação"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? "Ver Ativos" : "Ver Histórico"}
          </Button>
          <Button
            variant="primary"
            onClick={() => setLocation("/incubation/create")}
          >
            + Novo Lote
          </Button>
        </div>
      </div>

      {filteredIncubations.length === 0 ? (
        <EmptyState
          icon={showHistory ? "📜" : "🥚"}
          title={showHistory ? "Nenhum histórico encontrado" : "Nenhum lote ativo"}
          description={showHistory
            ? "Lotes eclodidos aparecerão aqui."
            : "Comece criando um novo lote de incubação"}
          action={
            !showHistory && (
              <Button
                variant="primary"
                onClick={() => setLocation("/incubation/create")}
              >
                Criar Lote
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIncubations.map((incubation) => (
            <Card key={incubation.id} className={`hover:shadow-lg transition-shadow ${incubation.status !== 'incubating' ? 'opacity-75 bg-gray-50' : ''}`}>
              <CardHeader>
                <CardTitle className="text-lg">{incubation.batchNumber}</CardTitle>
                <CardDescription>
                  <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${incubation.status === 'incubating' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                    {incubation.status === 'incubating' ? 'Incubando' : 'Eclodido'}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Ovos</p>
                    <p className="font-semibold">{formatQuantity(incubation.eggQuantity)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Eclodiram</p>
                    <p className="font-semibold">{formatQuantity(incubation.hatchedQuantity || 0)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Temperatura</p>
                    <p className="font-semibold">{incubation.temperature}°C</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Umidade</p>
                    <p className="font-semibold">{incubation.humidity}%</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setLocation(`/incubation/${incubation.id}`)}
                  >
                    Detalhes
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(incubation.id)}
                    isLoading={isDeleting}
                  >
                    Deletar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
