import { useLocation } from "wouter";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Loading from "@/components/ui/Loading";
import { useSales } from "@/hooks/useSales";
import { formatDate } from "@/utils/date";
import { formatQuantity, formatCurrency } from "@/utils/format";

export default function SalesHistory() {
  const [, setLocation] = useLocation();
  const { sales, isLoading } = useSales();

  const totalRevenue = sales.reduce((acc, sale) => acc + sale.totalPrice, 0);
  const totalQuantity = sales.reduce((acc, sale) => acc + sale.quantity, 0);

  if (isLoading) {
    return <Loading fullScreen message="Carregando histórico..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Histórico de Vendas</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe todas as suas vendas
          </p>
        </div>
      </div>

      {sales.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground">Receita Total</p>
            <p className="text-3xl font-bold text-primary">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground">Quantidade Vendida</p>
            <p className="text-3xl font-bold text-primary">{formatQuantity(totalQuantity)}</p>
          </div>
        </div>
      )}

      {sales.length === 0 ? (
        <EmptyState
          icon="💰"
          title="Nenhuma venda registrada"
          description="Comece registrando suas vendas"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold text-foreground">Data</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Produto</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Quantidade</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Preço Unit.</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Total</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Comprador</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id} className="border-b border-border hover:bg-muted/50">
                  <td className="py-3 px-4">{formatDate(sale.date)}</td>
                  <td className="py-3 px-4 capitalize">{sale.productType}</td>
                  <td className="py-3 px-4">{formatQuantity(sale.quantity)}</td>
                  <td className="py-3 px-4">{formatCurrency(sale.unitPrice)}</td>
                  <td className="py-3 px-4 font-semibold">{formatCurrency(sale.totalPrice)}</td>
                  <td className="py-3 px-4">{sale.buyer || "-"}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${sale.status === "completed" ? "bg-green-100 text-green-800" :
                      sale.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                      {sale.status === "completed" ? "Concluída" :
                        sale.status === "pending" ? "Pendente" : "Cancelada"}
                    </span>
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
