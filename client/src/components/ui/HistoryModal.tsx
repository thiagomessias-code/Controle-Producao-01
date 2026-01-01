import React, { useEffect, useState } from 'react';
import { supabaseClient } from '@/api/supabaseClient';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    entityType: string;
    entityId?: string; // Optional
    entityName?: string;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
    isOpen,
    onClose,
    entityType,
    entityId,
    entityName
}) => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchLogs();
        }
    }, [isOpen, entityId]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            let url = `/audit/${entityType}`;
            if (entityId) {
                url += `/${entityId}`;
            }

            const data = await supabaseClient.get(url);
            setLogs(data || []);
        } catch (error) {
            console.error("Erro ao buscar histórico:", error);
            setLogs([]); // Fail safe
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Histórico - {entityName || 'Detalhes'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    {loading ? (
                        <p className="text-center text-gray-500">Carregando...</p>
                    ) : logs.length === 0 ? (
                        <p className="text-center text-gray-500">Nenhum registro encontrado.</p>
                    ) : (
                        <div className="space-y-4">
                            {logs.map((log) => (
                                <div key={log.id} className="border-l-2 border-blue-500 pl-4 py-1">
                                    <div className="text-sm font-semibold">{log.action.toUpperCase()}</div>
                                    <div className="text-xs text-gray-500">
                                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                        {' - '}
                                        <span className="text-gray-700 font-medium">
                                            {log.users?.name || 'Sistema'}
                                        </span>
                                    </div>
                                    {log.details && (
                                        <div className="mt-1 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                            <pre className="whitespace-pre-wrap font-sans">
                                                {JSON.stringify(log.details, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
