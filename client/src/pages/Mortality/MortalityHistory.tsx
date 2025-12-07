import { useLocation } from "wouter";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Loading from "@/components/ui/Loading";
import { useMortality } from "@/hooks/useMortality";
import { formatDate } from "@/utils/date";
import { formatQuantity } from "@/utils/format";

export default function MortalityHistory() {
  const [, setLocation] = useLocation();
  const { mortalities, isLoading, isDeleting, delete: deleteMortality } = useMortality();

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja deletar este registro?")) {
      deleteMortality(id);
    }
  };

  if (isLoading) {
    return <Loading fullScreen message="Carregando histórico..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Histórico de Mortalidade</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe a mortalidade dos seus grupos
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setLocation("/mortality/register")}
        >
          + Novo Registro
        </Button>
      </div>

      {mortalities.length === 0 ? (
        <EmptyState
          icon="📊"
          title="Nenhum registro de mortalidade"
          description="Comece registrando a mortalidade dos seus grupos"
          action={
            <Button
              variant="primary"
              onClick={() => setLocation("/mortality/register")}
            >
              Registrar Mortalidade
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
                <th className="text-left py-3 px-4 font-semibold text-foreground">Causa</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Notas</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {mortalities.map((mortality) => (
                <tr key={mortality.id} className="border-b border-border hover:bg-muted/50">
                  <td className="py-3 px-4">{formatDate(mortality.date)}</td>
                  <td className="py-3 px-4">{formatQuantity(mortality.quantity)}</td>
                  <td className="py-3 px-4">{mortality.cause}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {mortality.notes ? mortality.notes.substring(0, 50) : "-"}
                  </td>
                  <td className="py-3 px-4">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(mortality.id)}
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
