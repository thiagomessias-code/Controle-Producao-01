import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Search, Filter, Egg, Calendar } from 'lucide-react';
import { incubationApi } from '@/api/incubation';
import { aviariesApi } from '@/api/aviaries';
import { batchesApi } from '@/api/batches';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";

export const AdminIncubation: React.FC = () => {
    const [incubations, setIncubations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [selectedIncubation, setSelectedIncubation] = useState<any | null>(null);

    // Aviary & Batch Data for Filtering
    const [aviaries, setAviaries] = useState<any[]>([]);
    const [batches, setBatches] = useState<any[]>([]);
    const [selectedAviaryId, setSelectedAviaryId] = useState<string>(() => localStorage.getItem('admin_selected_aviary_id') || "");

    useEffect(() => {
        fetchData();
        if (selectedAviaryId) {
            localStorage.setItem('admin_selected_aviary_id', selectedAviaryId);
        }
    }, [filter, selectedAviaryId]);

    // Auto-select if only one aviary
    useEffect(() => {
        if (aviaries.length === 1 && !selectedAviaryId) {
            setSelectedAviaryId(String(aviaries[0].id));
        }
    }, [aviaries, selectedAviaryId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch data independently to prevent one failure from blocking all
            const incData = await incubationApi.getAll().catch(err => {
                console.error("Failed to load incubations", err);
                return [];
            });

            const avData = await aviariesApi.getAll().catch(err => {
                console.error("Failed to load aviaries", err);
                return [];
            });

            const batchesData = await batchesApi.getAll().catch(err => {
                console.error("Failed to load batches", err);
                return [];
            });

            setAviaries(avData);
            setBatches(batchesData);

            let filtered = incData;

            // 1. Filter by Aviary (match batchNumber to batch.name or id? usually incubation batch matches a production batch name/id?)
            // Assuming incubation.batchNumber corresponds to a Batch Name or ID. 
            // Let's try to match by name first.
            if (selectedAviaryId) {
                // Get batch IDs belonging to this aviary
                const aviaryBatches = batchesData
                    .filter((b: any) => String(b.aviaryId) === String(selectedAviaryId));

                const validBatchNames = aviaryBatches.map((b: any) => b.name?.toLowerCase().trim());
                const validBatchIds = aviaryBatches.map((b: any) => String(b.id));

                filtered = filtered.filter((inc: any) => {
                    // Singleton Fallback: If there is ONLY ONE aviary in the system, 
                    // and we are looking at it, show all incubations.
                    if (avData.length === 1 && String(avData[0].id) === String(selectedAviaryId)) return true;

                    // 1. Direct match with Aviary Batches IDs (Best case)
                    if (inc.batchId && validBatchIds.includes(String(inc.batchId))) return true;

                    // 2. Direct Aviary Link
                    if (String(inc.batchId) === String(selectedAviaryId)) return true;

                    // 3. Robust Name Matching (Includes check)
                    // Allows "Batch 01 - Old" to match "Batch 01"
                    if (inc.batchNumber) {
                        const incBatch = inc.batchNumber.toLowerCase().trim();
                        // Check if exact match exists in names OR IDs
                        if (validBatchNames.includes(incBatch)) return true;
                        if (validBatchIds.includes(incBatch)) return true;

                        // Check partial matches (e.g. formatted names)
                        const isPartialMatch = validBatchNames.some(name => incBatch.includes(name) || name.includes(incBatch));
                        if (isPartialMatch) return true;
                    }

                    return false;
                });
            }

            // 2. Text Filter
            if (filter) {
                const term = filter.toLowerCase();
                filtered = filtered.filter((inc: any) =>
                    (inc.batchNumber?.toLowerCase() || '').includes(term) ||
                    (inc.status?.toLowerCase() || '').includes(term)
                );
            }

            setIncubations(filtered);
        } catch (error) {
            console.error('Erro ao buscar incubações:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'incubating': return 'bg-yellow-100 text-yellow-800';
            case 'hatched': return 'bg-green-100 text-green-800';
            case 'failed': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'incubating': return 'Incubando';
            case 'hatched': return 'Eclodido';
            case 'failed': return 'Falhou';
            default: return status;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gerenciar Incubação</h1>
                    <p className="text-gray-500">Acompanhe o processo de incubação e eclosão.</p>
                </div>

                <div className="w-full md:w-64">
                    <select
                        className="w-full h-10 border rounded-lg px-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all text-sm"
                        value={selectedAviaryId}
                        onChange={(e) => setSelectedAviaryId(e.target.value)}
                    >
                        <option value="">Selecione um aviário...</option>
                        {aviaries.map(av => (
                            <option key={av.id} value={av.id}>{av.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Details Modal */}
            <Dialog open={!!selectedIncubation} onOpenChange={(open) => !open && setSelectedIncubation(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Lote de Incubação: {selectedIncubation?.batchNumber}</DialogTitle>
                        <DialogDescription>ID: {selectedIncubation?.id}</DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="bg-blue-50 p-3 rounded">
                            <p className="text-xs text-gray-500">Ovos Totais</p>
                            <p className="font-bold text-lg">{selectedIncubation?.eggQuantity}</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded">
                            <p className="text-xs text-gray-500">Eclodidos</p>
                            <p className="font-bold text-lg">{selectedIncubation?.hatchedQuantity || '-'}</p>
                        </div>
                        <div className="bg-orange-50 p-3 rounded">
                            <p className="text-xs text-gray-500">Início</p>
                            <p className="font-bold text-lg">{selectedIncubation && new Date(selectedIncubation.startDate).toLocaleDateString()}</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded">
                            <p className="text-xs text-gray-500">Previsão</p>
                            <p className="font-bold text-lg">{selectedIncubation && new Date(selectedIncubation.expectedHatchDate).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="border-t pt-4 mt-2">
                        <h4 className="font-bold mb-2 text-sm">Histórico</h4>
                        <div className="max-h-40 overflow-y-auto space-y-2 text-sm">
                            {selectedIncubation?.history?.map((h: any, i: number) => (
                                <div key={i} className="border-b pb-1">
                                    <p className="font-bold text-xs">{h.event}</p>
                                    <p className="text-xs text-gray-500">{new Date(h.date).toLocaleString()} - {h.details}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {!selectedAviaryId ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-gray-300">
                    <div className="p-4 bg-gray-50 rounded-full mb-4">
                        <Filter size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Selecione um Aviário</h3>
                    <p className="text-gray-500 text-center max-w-md mt-1">
                        Para visualizar as incubações, você deve primeiro selecionar o aviário desejado no filtro acima.
                    </p>
                </div>
            ) : (
                <Card>
                    <CardHeader>
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Buscar por Lote ou Status..."
                                    className="pl-10"
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                />
                            </div>
                            <Button variant="outline">
                                <Filter className="mr-2 h-4 w-4" />
                                Filtros
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {loading ? <p>Carregando...</p> : incubations.map(inc => {
                                const badgeColor = getStatusColor(inc.status);

                                return (
                                    <div key={inc.id}
                                        onClick={() => setSelectedIncubation(inc)}
                                        className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-white"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-xs font-bold px-2 py-1 rounded ${badgeColor}`}>
                                                {getStatusLabel(inc.status)}
                                            </span>
                                            <span className="text-xs text-gray-500">{new Date(inc.startDate).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="font-bold text-lg mb-1">{inc.batchNumber}</h3>
                                        <p className="text-sm text-gray-600 mb-2">
                                            {inc.species}
                                        </p>
                                        <div className="flex items-center text-xs text-gray-500 gap-2">
                                            <Egg size={14} />
                                            <span>Ovos: {inc.eggQuantity}</span>
                                            {inc.hatchedQuantity && <span>• Eclodidos: {inc.hatchedQuantity}</span>}
                                        </div>
                                    </div>
                                );
                            })}
                            {!loading && incubations.length === 0 && <p className="text-center text-gray-500 col-span-3">Nenhum lote de incubação encontrado para este aviário.</p>}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
