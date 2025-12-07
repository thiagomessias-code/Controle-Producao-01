import { useLocation } from "wouter";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Loading from "@/components/ui/Loading";
import { useProduction } from "@/hooks/useProduction";
import { formatDate } from "@/utils/date";
import { formatQuantity, formatWeight } from "@/utils/format";

export default function ProductionHistory() {
  const [, setLocation] = useLocation();
  const { productions, isLoading, isDeleting, delete: deleteProduction } = useProduction();

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja deletar este registro?")) {
      deleteProduction(id);
    }
  };

  if (isLoading) {
    return <Loading fullScreen message="Carregando histórico..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Histórico de Produção</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe toda a produção dos seus grupos
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setLocation("/production/register")}
        >
          + Novo Registro
        </Button>
      </div>

      {productions.length === 0 ? (
        <EmptyState
          icon="📊"
          title="Nenhum registro de produção"
          description="Comece registrando a produção dos seus grupos"
          action={
            <Button
              variant="primary"
              onClick={() => setLocation("/production/register")}
            >
              Registrar Produção
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold text-foreground">Data</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Quantidade</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Peso</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Qualidade</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {productions.map((production) => (
                <tr key={production.id} className="border-b border-border hover:bg-muted/50">
                  <td className="py-3 px-4">{formatDate(production.date)}</td>
                  <td className="py-3 px-4">{formatQuantity(production.quantity)}</td>
                  <td className="py-3 px-4">
                    {production.weight ? formatWeight(production.weight) : "-"}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-sm font-medium">
                      {production.quality}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(production.id)}
                      isLoading={isDeleting}
                    >
                      Deletar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
