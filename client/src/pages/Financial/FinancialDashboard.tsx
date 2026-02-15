import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useSales } from "@/hooks/useSales";
import { useGroups } from "@/hooks/useGroups";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatQuantity } from "@/utils/format";
import { formatDate } from "@/utils/date";
import Loading from "@/components/ui/Loading";

export default function FinancialDashboard({ selectedAviaryId: propAviaryId }: { selectedAviaryId?: string }) {
    const { sales, isLoading: loadingSales } = useSales();
    const { groups, isLoading: loadingGroups } = useGroups();
    const { user } = useAuth();

    const [dateStart, setDateStart] = useState(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    );
    const [dateEnd, setDateEnd] = useState(
        new Date().toISOString().split('T')[0]
    );

    const [selectedAviaryId, setSelectedAviaryId] = useState(() => localStorage.getItem('admin_selected_aviary_id') || "");
    const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
    const [aviaries, setAviaries] = useState<any[]>([]);
    const [batches, setBatches] = useState<any[]>([]);

    const setQuickFilter = (type: 'today' | 'week' | 'month') => {
        const end = new Date();
        let start = new Date();

        if (type === 'today') {
            // Stay as today
        } else if (type === 'week') {
            start.setDate(end.getDate() - 7);
        } else if (type === 'month') {
            start.setMonth(end.getMonth() - 1);
        }

        setDateStart(start.toISOString().split('T')[0]);
        setDateEnd(end.toISOString().split('T')[0]);
    };

    // Sync prop with state if provided
    useEffect(() => {
        if (propAviaryId) {
            setSelectedAviaryId(propAviaryId);
        }
    }, [propAviaryId]);

    // Persist selection
    useEffect(() => {
        if (selectedAviaryId) {
            localStorage.setItem('admin_selected_aviary_id', selectedAviaryId);
        }
    }, [selectedAviaryId]);

    // Auto-select if only one aviary
    useEffect(() => {
        if (aviaries.length === 1 && !selectedAviaryId && !propAviaryId) {
            setSelectedAviaryId(String(aviaries[0].id));
        }
    }, [aviaries, selectedAviaryId, propAviaryId]);

    // Derived active filter: use prop if present, else local state
    const activeAviaryId = propAviaryId || (selectedAviaryId === 'all' ? '' : selectedAviaryId);
    const [filteredSales, setFilteredSales] = useState<any[]>([]);

    // Unique Aviaries from Groups
    const uniqueAviaries = Array.from(new Set(groups?.map(g => g.aviaryId).filter(Boolean)));
    // We need aviary names. Assuming groups have aviary details nested or we fetch aviaries.
    // Actually, Sales link to *Groups*. `sales.ts` maps `groupId`.
    // From `groupId`, we find the Group in `groups`. The Group has `aviaryId`.
    // We need to fetch Aviaries to show names? Or Group has `aviary_name` (if mapped)?
    // Let's assume Group has `aviarios` expanded or we just use Group Name.
    // User asked for "Aviario".
    // `useGroups` hook usually fetches groups.
    // Let's inspect `useGroups` output or `groups` structure.
    // Assuming `groups` has `aviaryId`.


    // Fetch Aviaries and Batches for precise linking
    useEffect(() => {
        import('@/api/aviaries').then(m => m.aviariesApi.getAll().then(setAviaries));
        import('@/api/batches').then(m => m.batchesApi.getAll().then(setBatches));
    }, []);

    useEffect(() => {
        if (!sales) return;

        const start = new Date(dateStart);
        const end = new Date(dateEnd);
        end.setHours(23, 59, 59, 999);

        const filtered = sales.filter(s => {
            const sDate = new Date(s.date);
            if (sDate < start || sDate > end) return false;

            if (paymentMethodFilter !== 'all' && s.paymentMethod !== paymentMethodFilter) return false;

            if (activeAviaryId) {
                // Unified Matching Logic (Steps 0-4)


                // 1. Precise Group ID Matching
                const group = groups?.find(g => String(g.id) === String(s.groupId));
                if (group && String(group.aviaryId) === String(activeAviaryId)) return true;

                // 2. Direct Aviary ID Matching
                if (String(s.groupId) === String(activeAviaryId)) return true;

                // 3. precise Batch ID Matching (The "Warehouse" Fix)
                // If sale has a batchId, check if that batch belongs to this aviary
                if (s.batchId) {
                    const batch = batches.find(b => String(b.id) === String(s.batchId));
                    // Check if batch linked to aviary (directly or via aviary_id field)
                    if (batch && String(batch.aviary_id || batch.aviaryId) === String(activeAviaryId)) return true;
                    // Also check if batch ID IS the active aviary (legacy)
                    if (String(s.batchId) === String(activeAviaryId)) return true;
                }

                // 4. Smart Text Fallback (Enhanced)
                if (s.groupId === 'warehouse' || !s.groupId) {
                    // Singleton Fallback: If there is ONLY ONE aviary in the system, 
                    // and we are looking at it, show all warehouse items.
                    if (aviaries.length === 1 && String(aviaries[0].id) === String(activeAviaryId)) return true;

                    const searchContent = (s.notes + ' ' + (s.originText || '')).toLowerCase()
                        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

                    const normalize = (txt: string) => txt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

                    // A. Check content for Aviary Name
                    const targetAviary = aviaries.find(a => String(a.id) === String(activeAviaryId));
                    if (targetAviary) {
                        const avName = normalize(targetAviary.name);

                        // Search in notes, origin AND product name
                        const fullContent = searchContent + ' ' + normalize(s.productType);

                        // 1. Exact match
                        if (fullContent.includes(avName)) return true;

                        // 2. Significant parts match (Words > 3 chars)
                        // Normalize further removing plural 's' for fuzzy matching
                        const stem = (w: string) => w.replace(/s$/, "");
                        const fullContentStemmed = fullContent.split(/\s+/).map(stem).join(" ");

                        const parts = avName.split(/\s+/).filter(p => p.length > 3 || /^\d+$/.test(p));
                        if (parts.length > 0 && parts.some(p => {
                            const pStem = stem(p);
                            return fullContent.includes(p) || fullContent.includes(pStem) || fullContentStemmed.includes(pStem);
                        })) {
                            return true;
                        }
                    }

                    // B. Check content for Group Names
                    const aviaryGroups = groups?.filter(g => String(g.aviaryId) === String(activeAviaryId)) || [];
                    const hasGroupMatch = aviaryGroups.some(g => {
                        const gName = normalize(g.name);
                        if (searchContent.includes(gName)) return true;

                        const gParts = gName.split(/\s+/).filter(p => p.length > 2 || /^\d+$/.test(p));
                        return gParts.length > 0 && gParts.every(p => searchContent.includes(p));
                    });

                    if (hasGroupMatch) return true;
                }

                return false;
            }
            return true;
        });

        // Debug Logging
        console.log(`Filtering for Aviary ${activeAviaryId}: ${filtered.length} matches out of ${sales.length}`);

        setFilteredSales(filtered);
    }, [sales, dateStart, dateEnd, selectedAviaryId, activeAviaryId, groups, aviaries, batches]);


    // Calculations
    const totalRevenue = filteredSales.reduce((acc, s) => acc + s.totalPrice, 0);
    const totalQty = filteredSales.reduce((acc, s) => acc + s.quantity, 0);

    // Group by Day
    const dailyStats = filteredSales.reduce((acc: any, s) => {
        const day = s.date.split('T')[0];
        if (!acc[day]) acc[day] = 0;
        acc[day] += s.totalPrice;
        return acc;
    }, {});

    // Identify Aviaries for Dropdown (Mocking name if not available)
    // Ideally we use `useAviaries` but let's try to derive from groups first.

    if (loadingSales || loadingGroups) return <Loading fullScreen message="Carregando financeiro..." />;

    const isAdmin = user?.role === 'admin' || user?.role === 'gerente';

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Painel Financeiro</h1>
                    <p className="text-muted-foreground">Relatórios de vendas e desempenho por aviário.</p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block">Data Início</label>
                        <input
                            type="date"
                            className="w-full p-2 border rounded"
                            value={dateStart}
                            onChange={e => setDateStart(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Data Fim</label>
                        <input
                            type="date"
                            className="w-full p-2 border rounded"
                            value={dateEnd}
                            onChange={e => setDateEnd(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Filtrar por Aviário</label>
                        {propAviaryId ? (
                            <div className="p-2 border rounded bg-gray-50 text-gray-500 italic">
                                Filtrado pelo Admin ({propAviaryId})
                            </div>
                        ) : (
                            <select
                                className="w-full p-2 border rounded"
                                value={selectedAviaryId}
                                onChange={e => setSelectedAviaryId(e.target.value)}
                            >
                                <option value="">Selecione um aviário...</option>
                                {/* We need valid aviary list. For now, extracting from groups present in sales? */}
                                {/* Better: Use Groups to find distinct Aviary IDs */}
                                {aviaries.map(av => (
                                    <option key={av.id} value={av.id}>{av.name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Forma de Pagamento</label>
                        <select
                            className="w-full p-2 border rounded"
                            value={paymentMethodFilter}
                            onChange={e => setPaymentMethodFilter(e.target.value)}
                        >
                            <option value="all">Todas as Formas</option>
                            <option value="cash">Dinheiro</option>
                            <option value="payment_app">Pix / App</option>
                            <option value="transfer">Transferência</option>
                            <option value="other">Outros</option>
                        </select>
                    </div>
                    <div className="flex items-end gap-2 md:col-span-4">
                        <Button variant="outline" size="sm" onClick={() => setQuickFilter('today')} className="font-bold border-blue-100 text-blue-600">HOJE</Button>
                        <Button variant="outline" size="sm" onClick={() => setQuickFilter('week')} className="font-bold border-blue-100 text-blue-600">ÚLTIMOS 7 DIAS</Button>
                        <Button variant="outline" size="sm" onClick={() => setQuickFilter('month')} className="font-bold border-blue-100 text-blue-600">ESTE MÊS</Button>
                        <div className="flex-1"></div>
                        <Button variant="outline" onClick={() => window.print()} className="px-8">
                            🖨️ Imprimir
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Totals Cards */}
            {!activeAviaryId ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-gray-300">
                    <div className="p-4 bg-gray-50 rounded-full mb-4">
                        <Button variant="ghost" disabled>📊</Button>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Selecione um Aviário</h3>
                    <p className="text-gray-500 text-center max-w-md mt-1">
                        Selecione um aviário acima para visualizar os dados financeiros.
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-sm text-muted-foreground">Faturamento do Período</p>
                                <p className="text-3xl font-bold text-green-700">{formatCurrency(totalRevenue)}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-sm text-muted-foreground">Vendas Totais</p>
                                <p className="text-3xl font-bold">{filteredSales.length} registros</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-sm text-muted-foreground">Volume de Itens</p>
                                <p className="text-3xl font-bold">{formatQuantity(totalQty)}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalhamento de Vendas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted">
                                        <tr>
                                            <th className="p-3 text-left">Data</th>
                                            <th className="p-3 text-left">Produto</th>
                                            <th className="p-3 text-left">Qtd</th>
                                            <th className="p-3 text-left">Valor Total</th>
                                            <th className="p-3 text-left">Forma</th>
                                            <th className="p-3 text-left">Comprador</th>
                                            {isAdmin && <th className="p-3 text-left bg-blue-50 text-blue-800">Origem (Admin)</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredSales.map(sale => {
                                            const group = groups?.find(g => g.id === sale.groupId);
                                            const methodLabels: any = {
                                                'cash': '💵 Dinheiro',
                                                'payment_app': '📱 Pix/App',
                                                'transfer': '🏦 Transf.',
                                                'other': '❓ Outro'
                                            };
                                            return (
                                                <tr key={sale.id} className="border-b hover:bg-gray-50">
                                                    <td className="p-3">{formatDate(sale.date)}</td>
                                                    <td className="p-3 font-medium">{sale.productType}</td>
                                                    <td className="p-3">{formatQuantity(sale.quantity)}</td>
                                                    <td className="p-3 font-bold text-green-700">{formatCurrency(sale.totalPrice)}</td>
                                                    <td className="p-3">
                                                        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-600 uppercase">
                                                            {methodLabels[sale.paymentMethod] || sale.paymentMethod}
                                                        </span>
                                                    </td>
                                                    <td className="p-3">{sale.buyer || '-'}</td>
                                                    {isAdmin && (
                                                        <td className="p-3 bg-blue-50/50 text-xs text-blue-900">
                                                            Lote: {group?.name || 'N/A'}<br />
                                                            Aviário: {group?.aviaryId || 'Desconhecido'}
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {filteredSales.length === 0 && (
                                    <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-4">
                                        <div className="p-4 bg-gray-50 rounded-full">
                                            <Button variant="ghost" disabled>🔍</Button>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-semibold text-gray-900">Nenhum registro encontrado</p>
                                            <p className="text-sm text-gray-500">Tente ajustar o período ou o filtro de aviário.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div >
    );
}

