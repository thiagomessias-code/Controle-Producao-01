import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { warehouseApi, InventoryItem } from '@/api/warehouse';
import { aviariesApi } from '@/api/aviaries';
import { groupsApi } from '@/api/groups';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/ui/Loading';
import { Package, MapPin, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Button from '@/components/ui/Button';

export const AdminStock: React.FC = () => {
    const { user } = useAuth();
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [aviaries, setAviaries] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAviaryId, setSelectedAviaryId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [inv, avs, grps] = await Promise.all([
                warehouseApi.getInventory(),
                aviariesApi.getAll(),
                groupsApi.getAll()
            ]);
            setInventory(inv);
            setAviaries(avs);
            setGroups(grps);
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredInventory = inventory.filter(item => {
        if (!selectedAviaryId) return false; // Show nothing if no aviary selected

        // Find group of the item
        const group = groups.find(g => g.id === item.origin.groupId);
        if (!group) return false;

        // Check if group belongs to selected aviary
        const matchesAviary = String(group.aviaryId) === String(selectedAviaryId);

        // Filter out zero/negative quantity or finalized items if status exists
        return matchesAviary && item.quantity > 0;
    });

    if (loading) return <Loading message="Carregando estoque..." />;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header with Aviary Selector */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-orange-100">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                        <Package size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Gestão de Estoque</h1>
                        <p className="text-gray-500 text-sm">Controle de insumos e produção por aviário.</p>
                    </div>
                </div>

                <div className="w-full md:w-72">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                        Filtrar por Aviário (Obrigatório)
                    </label>
                    <Select
                        value={selectedAviaryId || ''}
                        onValueChange={setSelectedAviaryId}
                    >
                        <SelectTrigger className="w-full h-11 bg-gray-50 border-gray-200">
                            <div className="flex items-center gap-2">
                                <MapPin size={16} className="text-gray-400" />
                                <SelectValue placeholder="Selecione um aviário..." />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            {aviaries.map(aviary => (
                                <SelectItem key={aviary.id} value={aviary.id}>
                                    {aviary.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {!selectedAviaryId ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-gray-300">
                    <div className="p-4 bg-gray-50 rounded-full mb-4">
                        <Filter size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Selecione um Aviário</h3>
                    <p className="text-gray-500 text-center max-w-md mt-1">
                        Para visualizar o estoque, você deve primeiro selecionar o aviário desejado no filtro acima.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    <Card className="border-none shadow-sm overflow-hidden">
                        <div className="h-1 bg-orange-500 w-full"></div>
                        <CardHeader className="flex flex-row justify-between items-center px-6 pt-6">
                            <CardTitle className="text-lg text-gray-800">
                                Itens em Estoque - {aviaries.find(a => a.id === selectedAviaryId)?.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50/50 text-gray-700 font-semibold border-b border-gray-100">
                                        <tr>
                                            <th className="p-4 pl-6">Nome / Tipo</th>
                                            <th className="p-4">Categoria</th>
                                            <th className="p-4">Origem (Lote/Gaiola)</th>
                                            <th className="p-4">Data Entrada</th>
                                            <th className="p-4 pr-6 text-right">Quantidade Atual</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredInventory.map(item => (
                                            <tr key={item.id} className="hover:bg-orange-50/30 transition-colors">
                                                <td className="p-4 pl-6 font-medium text-gray-900">
                                                    {item.subtype || item.type}
                                                </td>
                                                <td className="p-4">
                                                    <span className="capitalize px-2 py-1 rounded-md bg-gray-100 text-gray-600 font-medium text-xs border border-gray-200">
                                                        {item.type}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-gray-600 text-xs">
                                                    {item.origin.batchId ? (
                                                        <span className="flex items-center gap-1">
                                                            <span className="font-bold">Lote:</span> {item.origin.batchId.substring(0, 8)}
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                                <td className="p-4 text-gray-500">
                                                    {new Date(item.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="p-4 pr-6 text-right font-bold text-gray-900">
                                                    {item.quantity}
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredInventory.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-gray-500">
                                                    Nenhum item em estoque para este aviário.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};
