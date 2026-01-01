import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Loading from "@/components/ui/Loading";
import { useSales } from "@/hooks/useSales";
import { formatDate } from "@/utils/date";
import { formatQuantity, formatCurrency } from "@/utils/format";
import { supabase, supabaseClient } from "@/api/supabaseClient";

export default function SalesHistory() {
  const { sales, isLoading: loadingSales } = useSales();
  const [users, setUsers] = useState<any[]>([]);
  const [variations, setVariations] = useState<any[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, { data: variationsData }] = await Promise.all([
          supabaseClient.get('/users'),
          supabase.from('product_variations').select('*')
        ]);
        setUsers(usersData || []);
        setVariations(variationsData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingExtras(false);
      }
    };
    fetchData();
  }, []);

  const totalRevenue = sales.reduce((acc, sale) => acc + sale.totalPrice, 0);
  const totalQuantity = sales.reduce((acc, sale) => acc + sale.quantity, 0);

  const getVariationName = (id?: string) => {
    if (!id) return '';
    const v = variations.find(v => v.id === id);
    return v ? ` - ${v.name}` : '';
  };

  const getUserName = (id?: string) => {
    if (!id) return '-';
    const u = users.find(u => u.id === id);
    return u ? u.name : 'Sistema/Admin';
  };

  if (loadingSales || loadingExtras) {
    return <Loading fullScreen message="Carregando histórico..." />;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100/50">
            Relatórios Financeiros
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Histórico de Vendas</h1>
          <p className="text-gray-500 font-medium text-lg leading-relaxed">
            Acompanhe a <span className="text-orange-600 font-bold">comercialização e auditoria</span> de pedidos.
          </p>
        </div>
      </div>

      {sales.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-none shadow-xl shadow-orange-100/30 overflow-hidden group">
            <CardContent className="pt-6 relative">
              <div className="absolute top-0 right-0 p-4 text-4xl opacity-10 group-hover:scale-110 transition-transform">💰</div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Receita Total Bruta</p>
              <p className="text-4xl font-black text-gray-900 group-hover:text-orange-600 transition-colors uppercase">
                {formatCurrency(totalRevenue)}
              </p>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-orange-50">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Saldo acumulado no período</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-orange-100/30 overflow-hidden group">
            <CardContent className="pt-6 relative">
              <div className="absolute top-0 right-0 p-4 text-4xl opacity-10 group-hover:scale-110 transition-transform">📦</div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Volume Total Comercializado</p>
              <p className="text-4xl font-black text-gray-900 group-hover:text-orange-600 transition-colors uppercase">
                {formatQuantity(totalQuantity)}
                <span className="text-lg font-bold text-gray-300 ml-2">un</span>
              </p>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-orange-50">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Unidades despachadas</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {sales.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-orange-100 rounded-[2rem] p-16 text-center">
          <div className="text-6xl mb-6 grayscale opacity-20">💰</div>
          <h3 className="text-xl font-black text-gray-900 mb-2">Sem vendas registradas</h3>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-8">Novas vendas aparecerão aqui após processadas</p>
          <Button
            variant="primary"
            onClick={() => setLocation("/sales/register")}
            className="rounded-xl font-black px-8"
          >
            REGISTRAR PRIMEIRA VENDA
          </Button>
        </div>
      ) : (
        <Card className="border-none shadow-2xl shadow-orange-100/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-orange-50/30 border-b border-orange-100/50">
                  <th className="p-6 text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em]">Data / Hora</th>
                  <th className="p-6 text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em]">Produto</th>
                  <th className="p-6 text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em]">Quantidade</th>
                  <th className="p-6 text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em]">Total Bruto</th>
                  <th className="p-6 text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em]">Cliente</th>
                  <th className="p-6 text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em]">Vendedor</th>
                  <th className="p-6 text-right text-[10px] font-black text-orange-900/50 uppercase tracking-[0.2em]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-50/50">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-orange-50/30 transition-all group">
                    <td className="p-6">
                      <span className="text-sm font-black text-gray-900 block">{formatDate(sale.date)}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                        {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="p-6">
                      <span className="text-sm font-black text-gray-900 capitalize block">{sale.productType}</span>
                      <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">{getVariationName(sale.product_variation_id).replace(' - ', '')}</span>
                    </td>
                    <td className="p-6">
                      <span className="text-lg font-black text-gray-900 tabular-nums">{formatQuantity(sale.quantity)}</span>
                    </td>
                    <td className="p-6">
                      <span className="text-lg font-black text-green-600 tabular-nums">{formatCurrency(sale.totalPrice || (sale.unitPrice * sale.quantity))}</span>
                    </td>
                    <td className="p-6">
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-tight">{sale.buyer || "Venda Balcão"}</span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-[10px] font-black text-orange-600 border-2 border-white shadow-sm">
                          {sale.userName?.[0]?.toUpperCase() || "S"}
                        </div>
                        <span className="text-xs font-bold text-gray-600">{sale.userName || "Sistema"}</span>
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${sale.status === "completed" ? "bg-green-600 text-white border-green-600 shadow-sm" :
                        sale.status === "pending" ? "bg-orange-100 text-orange-700 border-orange-200" :
                          "bg-red-50 text-red-600 border-red-100"
                        }`}>
                        {sale.status === "completed" ? "Paga" :
                          sale.status === "pending" ? "Pendente" : "Cancelada"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
