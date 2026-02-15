
import React, { useEffect, useState } from 'react';
import { ReportsCharts } from '@/components/reports/ReportsCharts';
import { ReportsInsights } from '@/components/reports/ReportsInsights';
import { ReportsChat } from '@/components/reports/ReportsChat';
import { ReportsTable } from '@/components/reports/ReportsTable';
import { ReportsStrategy } from '@/components/reports/ReportsStrategy';
import { reportsApi, type Report } from '@/api/reports';
import { aviariesApi } from '@/api/aviaries';
import { RefreshCw, Download, Sparkles, LayoutDashboard, TrendingUp, Target, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import Modal from '@/components/ui/Modal';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';

export const AdminReports: React.FC = () => {
    console.log('%c [IA PREMIUM] v5.1 - Interactive Strategy Active', 'background: #2563eb; color: #fff; font-weight: bold; padding: 4px; border-radius: 4px;');
    const [report, setReport] = useState<Report | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Aviary Context
    const [selectedAviaryId, setSelectedAviaryId] = useState<string>('');
    const [aviaries, setAviaries] = useState<any[]>([]);

    // Drill-down Modal State
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailData, setDetailData] = useState<any[]>([]);
    const [selectedDetail, setSelectedDetail] = useState<{ id: string, name: string }>({ id: '', name: '' });

    useEffect(() => {
        const fetchAviaries = async () => {
            try {
                const data = await aviariesApi.getAll();
                setAviaries(data || []);
            } catch (err) {
                console.error('Failed to load aviaries:', err);
            }
        };
        fetchAviaries();
    }, []);

    const loadLatest = async (aviaryId?: string) => {
        setLoading(true);
        try {
            setError(null);
            const data = await reportsApi.getLatest(aviaryId);
            if (data && (data as any).id) {
                setReport(data);
            } else {
                setReport(null);
            }
        } catch (error: any) {
            console.error('Failed to load report', error);
            setReport(null);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        setError(null);
        try {
            const data = await reportsApi.analyze(selectedAviaryId);
            setReport(data);
        } catch (error: any) {
            console.error('Failed to generate report', error);
            setError(error.message || 'Erro ao gerar relatório');
        } finally {
            setGenerating(false);
        }
    };

    const handleExportPDF = async () => {
        const element = document.getElementById('printable-report');
        if (!element) {
            setError('Conteúdo para PDF não encontrado');
            return;
        }

        try {
            setGenerating(true);
            const originalDisplay = element.style.display;
            element.style.display = 'block';

            // Pequeno delay para garantir renderização correta
            await new Promise(resolve => setTimeout(resolve, 150));
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            let heightLeft = pdfHeight;
            let position = 0;
            const pageHeight = pdf.internal.pageSize.getHeight();

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`relatorio-ia-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`);
            element.style.display = originalDisplay;
        } catch (error) {
            console.error('Failed to export PDF', error);
            setError('Falha ao gerar o arquivo PDF');
        } finally {
            setGenerating(false);
        }
    };

    const handleStrategyAction = (type: string) => {
        console.log('Strategy action clicked:', type);
        // Better UX: Focus chat and pre-fill question
        const chatInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        const chatContainer = document.querySelector('.glass-chat');

        if (chatContainer) {
            chatContainer.scrollIntoView({ behavior: 'smooth' });
        }

        if (chatInput) {
            chatInput.focus();
            if (type === 'priority') chatInput.value = "Quais são os protocolos para resolver os alertas críticos atuais?";
            if (type === 'efficiency') chatInput.value = "Como posso otimizar o consumo de ração?";
            if (type === 'prediction') chatInput.value = "Qual a tendência de produção para as próximas semanas?";
        }
    };

    const handleItemClick = async (id: string, name: string) => {
        console.log('[DRILL-DOWN] Clicking on:', name);
        setSelectedDetail({ id, name });
        setDetailModalOpen(true);
        setDetailLoading(true);

        try {
            // Decidir se é lote ou gaiola pelo nome (simplificação para v7.0)
            const type = (name.toUpperCase().includes('GAIOLA') || name.toUpperCase().includes('BOX')) ? 'gaiola' : 'lote';
            const history = await reportsApi.getHistoricalData(type, id);
            setDetailData(history);
        } catch (err) {
            console.error('Failed to load detail history:', err);
        } finally {
            setDetailLoading(false);
        }
    };

    useEffect(() => {
        loadLatest(selectedAviaryId);
    }, [selectedAviaryId]);

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 md:p-10 font-sans selection:bg-blue-100 no-print" id="report-content">
            <div className="max-w-7xl mx-auto space-y-10">
                {/* Minimalist Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print border-b border-gray-100 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-100">
                            <LayoutDashboard className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                                Dashboard Inteligente
                                <Sparkles className="w-5 h-5 text-blue-500 animate-pulse" />
                            </h2>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                                {report ? `Atualizado ${format(new Date(report.created_at), "HH:mm 'de' dd/MM", { locale: ptBR })}` : 'Aguardando Análise'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Selecionar Aviário</span>
                            <select
                                className="w-full md:w-64 h-11 border-2 border-gray-100 rounded-xl px-4 bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all text-xs font-bold text-gray-700"
                                value={selectedAviaryId}
                                onChange={(e) => setSelectedAviaryId(e.target.value)}
                            >
                                <option value="">Análise Global (Todos)</option>
                                {aviaries.map(av => (
                                    <option key={av.id} value={av.id}>{av.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-end gap-2">
                            <button
                                onClick={handleGenerate}
                                disabled={generating}
                                className="bg-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all rounded-xl h-11 px-6 text-xs font-black uppercase tracking-widest disabled:opacity-50 flex items-center gap-2"
                            >
                                {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                {generating ? 'Analisando...' : 'Nova Análise'}
                            </button>
                            {report && (
                                <button
                                    onClick={handleExportPDF}
                                    className="bg-white border-2 border-gray-100 text-gray-700 shadow-sm hover:bg-gray-50 transition-all rounded-xl h-11 px-6 text-xs font-black uppercase tracking-widest flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    PDF
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-600 text-white p-4 rounded-2xl shadow-lg shadow-red-100 animate-bounce no-print">
                        <p className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Erro: {error}
                        </p>
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40">
                        <div className="w-12 h-12 border-4 border-gray-100 border-t-blue-600 rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-6 animate-pulse">Cruzando Dados da Granja...</p>
                    </div>
                ) : report ? (
                    <div className="space-y-8 pb-10">
                        {/* Premium Quick Stats Bar */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
                            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-xl hover:shadow-blue-50 transition-all duration-500">
                                <div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Receita Semanal</span>
                                    <p className="text-2xl font-black text-gray-900">R$ {report.financial?.revenue?.toLocaleString('pt-BR') || '0,00'}</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-500">
                                    <Wallet className="w-6 h-6 text-green-600" />
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-xl hover:shadow-blue-50 transition-all duration-500">
                                <div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Taxa de Eclosão</span>
                                    <p className="text-2xl font-black text-gray-900">
                                        {report.genetics?.fertile_eggs > 0
                                            ? ((report.genetics.born_chicks / report.genetics.fertile_eggs) * 100).toFixed(1)
                                            : '0'}%
                                    </p>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-500">
                                    <Target className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-xl hover:shadow-blue-50 transition-all duration-500">
                                <div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Lucro Estimado</span>
                                    <p className="text-2xl font-black text-gray-900">R$ {report.financial?.balance?.toLocaleString('pt-BR') || '0,00'}</p>
                                </div>
                                <div className="bg-indigo-50 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-500">
                                    <TrendingUp className="w-6 h-6 text-indigo-600" />
                                </div>
                            </div>
                        </div>

                        <ReportsStrategy
                            insights={report.insights || []}
                            alerts={report.alertas || []}
                            onAction={handleStrategyAction}
                        />

                        <ReportsInsights insights={report.insights || []} alerts={report.alertas || []} />

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 px-2">
                                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Visualização Visual</h3>
                            </div>
                            <ReportsCharts charts={report.graficos} onItemClick={handleItemClick} />
                        </div>

                        <div className="pt-6">
                            <ReportsTable charts={report.graficos} onItemClick={handleItemClick} />
                        </div>

                        <div className="pt-10 border-t border-gray-50 no-print">
                            <div className="flex items-center gap-2 px-2 mb-4">
                                <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Assistente de Gestão</h3>
                            </div>
                            <ReportsChat />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200 no-print">
                        <div className="bg-white p-8 rounded-[32px] shadow-sm mb-8 animate-float">
                            <Sparkles className="w-16 h-16 text-blue-500" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">IA pronta para análise</h3>
                        <p className="text-gray-400 mb-10 text-center max-w-sm font-medium">Clique em 'Nova Análise' para processar os dados de produção e finanças da última semana.</p>
                    </div>
                )}
            </div>

            {/* Drill-down Modal v7.0 */}
            <Modal
                isOpen={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                title={`Evolução Detalhada: ${selectedDetail.name}`}
                size="lg"
            >
                <div className="space-y-6">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Tendência de Produção e Mortalidade (30 dias)
                    </p>

                    {detailLoading ? (
                        <div className="h-64 flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-gray-100 border-t-blue-600 rounded-full animate-spin"></div>
                        </div>
                    ) : detailData.length > 0 ? (
                        <div className="h-80 w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={detailData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#94a3b8"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => format(new Date(val), 'dd/MM')}
                                    />
                                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                    <ChartTooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Line
                                        type="monotone"
                                        name="Produção"
                                        dataKey="produção"
                                        stroke="#2563eb"
                                        strokeWidth={3}
                                        dot={{ fill: '#2563eb', r: 4 }}
                                    />
                                    <Line
                                        type="monotone"
                                        name="Mortalidade"
                                        dataKey="mortalidade"
                                        stroke="#ef4444"
                                        strokeWidth={3}
                                        dot={{ fill: '#ef4444', r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100 text-gray-400 font-bold text-sm">
                            Nenhum dado histórico encontrado para este período.
                        </div>
                    )}

                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                        <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mb-1 italic">Dica da IA v7.0</p>
                        <p className="text-xs text-blue-700 font-medium leading-relaxed">
                            O cruzamento de dados de produção e mortalidade ajuda a identificar variações repentinas que podem indicar problemas preventivos de saúde no lote.
                        </p>
                    </div>
                </div>
            </Modal>

            {/* Hidden printable report version */}
            <div id="printable-report" style={{ display: 'none', position: 'absolute', left: '-9999px', width: '800px', padding: '40px', backgroundColor: '#ffffff', color: '#000000', fontFamily: 'sans-serif' }}>
                <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #eeeeee', paddingBottom: '20px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 10px 0' }}>Relatório de Gestão - Codornas do Sertão</h1>
                    <p style={{ fontSize: '14px', color: '#666666', margin: '0' }}>Data: {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                    {selectedAviaryId && <p style={{ fontSize: '14px', color: '#666666', margin: '5px 0 0 0' }}>Aviário: {aviaries.find(a => a.id === selectedAviaryId)?.name || selectedAviaryId}</p>}
                </div>

                {report && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '30px' }}>
                        <div style={{ padding: '15px', backgroundColor: '#f9fafb', borderRadius: '10px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                            <p style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#666666', margin: '0 0 5px 0' }}>Ovos Produzidos</p>
                            <p style={{ fontSize: '20px', fontWeight: 'bold', margin: '0' }}>{report.producaoTotal}</p>
                        </div>
                        <div style={{ padding: '15px', backgroundColor: '#f9fafb', borderRadius: '10px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                            <p style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#666666', margin: '0 0 5px 0' }}>Mortalidade Total</p>
                            <p style={{ fontSize: '20px', fontWeight: 'bold', margin: '0' }}>{report.mortalidadeTotal}</p>
                        </div>
                        <div style={{ padding: '15px', backgroundColor: '#f9fafb', borderRadius: '10px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                            <p style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#666666', margin: '0 0 5px 0' }}>Taxa Postura</p>
                            <p style={{ fontSize: '20px', fontWeight: 'bold', margin: '0' }}>{report.taxaMediaPostura}%</p>
                        </div>
                        <div style={{ padding: '15px', backgroundColor: '#f9fafb', borderRadius: '10px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                            <p style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#666666', margin: '0 0 5px 0' }}>Receita Total</p>
                            <p style={{ fontSize: '20px', fontWeight: 'bold', margin: '0' }}>R$ {report.faturamentoTotal?.toLocaleString()}</p>
                        </div>
                    </div>
                )}

                {report?.insights && report.insights.length > 0 && (
                    <div style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#2563eb' }}>Análise da IA (Insights)</h2>
                        <ul style={{ paddingLeft: '20px', margin: '0' }}>
                            {report.insights.map((insight: string, i: number) => {
                                // If it's a JSON string, try to extract the main text or just show as is if not possible
                                let displayText = insight;
                                try {
                                    if (insight.startsWith('{') || insight.startsWith('[')) {
                                        const parsed = JSON.parse(insight);
                                        displayText = typeof parsed === 'string' ? parsed : (parsed.diagnostico || insight);
                                    }
                                } catch (e) { }

                                return (
                                    <li key={i} style={{ marginBottom: '10px', fontSize: '14px', lineHeight: '1.5' }}>{displayText}</li>
                                );
                            })}
                        </ul>
                    </div>
                )}

                {report?.alertas && report.alertas.length > 0 && (
                    <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#fff7ed', borderRadius: '15px', border: '1px solid #ffedd5' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#ea580c' }}>Alertas Críticos</h2>
                        <ul style={{ paddingLeft: '20px', margin: '0' }}>
                            {report.alertas.map((alerta: any, i: number) => (
                                <li key={i} style={{ marginBottom: '10px', fontSize: '14px', lineHeight: '1.5', color: '#9a3412', fontWeight: 'bold' }}>
                                    {typeof alerta === 'object' ? (alerta.mensagem || JSON.stringify(alerta)) : alerta}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {report?.graficos && report.graficos.length > 0 && (
                    <div>
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#2563eb' }}>Detalhamento por Grupo</h2>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                    <th style={{ textAlign: 'left', padding: '12px', fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>GRUPO</th>
                                    <th style={{ textAlign: 'right', padding: '12px', fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>PRODUÇÃO</th>
                                    <th style={{ textAlign: 'right', padding: '12px', fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>TAXA</th>
                                    <th style={{ textAlign: 'right', padding: '12px', fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>MORTOS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.graficos.map((item: any, i: number) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '12px', fontSize: '13px', fontWeight: 'bold' }}>{item.name}</td>
                                        <td style={{ padding: '12px', fontSize: '13px', textAlign: 'right' }}>{item.produção}</td>
                                        <td style={{ padding: '12px', fontSize: '13px', textAlign: 'right' }}>{item.taxa}%</td>
                                        <td style={{ padding: '12px', fontSize: '13px', textAlign: 'right', color: item.mortalidade > 0 ? '#ef4444' : '#000000' }}>{item.mortalidade}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #eeeeee', textAlign: 'center', fontSize: '10px', color: '#999999' }}>
                    Documento gerado automaticamente pelo sistema de gestão Codornas do Sertão.
                </div>
            </div>
        </div>
    );
};
