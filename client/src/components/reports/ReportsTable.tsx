import React from 'react';
import type { Graphics } from '@/api/reports';

interface ReportsTableProps {
    charts: Graphics[];
    onItemClick?: (id: string, name: string) => void;
}

export const ReportsTable: React.FC<ReportsTableProps> = ({ charts, onItemClick }) => {
    if (!charts || charts.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden no-print">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Resumo de Dados Exatos</h3>
                <span className="text-[10px] text-gray-400 font-medium">Dados brutos da análise</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-gray-50/50 text-gray-500 font-bold border-b border-gray-100">
                            <th className="px-6 py-3">Indicador</th>
                            <th className="px-6 py-3">Item</th>
                            <th className="px-6 py-3 text-right">Valor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {charts.map((chart) =>
                            (chart.data || []).map((item, idx) => (
                                <tr
                                    key={`${chart.id}-${idx}`}
                                    className={`hover:bg-blue-50/30 transition-colors group ${onItemClick ? 'cursor-pointer' : ''}`}
                                    onClick={() => onItemClick && onItemClick(item.name, item.name)} // Simplified ID as name for now
                                >
                                    <td className="px-6 py-3 font-semibold text-gray-400 group-hover:text-blue-500 text-[11px] uppercase">
                                        {idx === 0 ? chart.title : ''}
                                    </td>
                                    <td className="px-6 py-3 text-gray-700 font-medium">
                                        {item.name}
                                    </td>
                                    <td className="px-6 py-3 text-right font-black text-gray-900">
                                        {(item.value ?? 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
