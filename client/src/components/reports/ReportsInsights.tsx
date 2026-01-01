import React from 'react';
import { Lightbulb, AlertTriangle, AlertCircle, TrendingUp, ClipboardCheck, ArrowUpRight, Zap, ShieldAlert } from 'lucide-react';

interface ReportsInsightsProps {
    insights: string[];
    alerts: Array<{ tipo: string; mensagem: string; nivel: 'info' | 'warning' | 'critical' }>;
}

interface AnalysisBlockProps {
    title: string;
    icon: any;
    color: string;
    children: React.ReactNode;
}

const AnalysisBlock: React.FC<AnalysisBlockProps> = ({ title, icon: Icon, color, children }) => (
    <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col hover:shadow-xl transition-all duration-500">
        <div className="flex items-center gap-3 mb-6">
            <div className={`p-2.5 rounded-xl ${color} bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
                <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">{title}</h3>
        </div>
        <div className="flex-1">
            {children}
        </div>
    </div>
);

export const ReportsInsights: React.FC<ReportsInsightsProps> = ({ insights = [], alerts = [] }) => {
    // Parser for the new structured analysis from backend
    const getSafeAnalysis = () => {
        try {
            return {
                diagnostico: insights[0] || "Aguardando geração de diagnóstico técnico...",
                problemas: JSON.parse(insights[1] || '[]'),
                recomendacoes: JSON.parse(insights[2] || '[]'),
                riscos: insights[3] || "Sem projeções de risco detectadas no momento."
            };
        } catch (e) {
            console.warn("Failed to parse structured IA analysis. Falling back to legacy rendering.");
            return null;
        }
    };

    const analysis = getSafeAnalysis();

    if (!analysis) {
        // Fallback for old reports or parsing errors
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {insights.map((insight, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-yellow-500 shrink-0" />
                        <p className="text-sm text-gray-600 font-medium">{insight}</p>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-8 mb-10">
            {/* Critical Alerts Header */}
            {alerts.filter(a => a.nivel === 'critical').map((alert, idx) => (
                <div key={idx} className="bg-red-600 text-white p-6 rounded-[32px] shadow-2xl shadow-red-100 flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                        <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-80 block mb-1">Impacto Imediato</span>
                        <h4 className="text-lg font-black leading-tight mb-1">{alert.tipo}</h4>
                        <p className="text-sm font-bold opacity-90">{alert.mensagem}</p>
                    </div>
                </div>
            ))}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <AnalysisBlock title="Diagnóstico Geral" icon={ClipboardCheck} color="text-blue-600">
                    <p className="text-sm text-gray-600 leading-relaxed font-medium">
                        {analysis.diagnostico}
                    </p>
                </AnalysisBlock>

                <AnalysisBlock title="Riscos e Impactos" icon={TrendingUp} color="text-purple-600">
                    <p className="text-sm text-gray-600 leading-relaxed font-medium">
                        {analysis.riscos}
                    </p>
                </AnalysisBlock>

                <AnalysisBlock title="Problemas Detectados" icon={ShieldAlert} color="text-orange-600">
                    <div className="space-y-4">
                        {analysis.problemas.length > 0 ? analysis.problemas.map((p: any, i: number) => (
                            <div key={i} className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100/50">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="bg-white px-2.5 py-1 rounded-lg text-[10px] font-black text-orange-600 border border-orange-100 shadow-sm uppercase tracking-wider">
                                        Lote: {p.lote}
                                    </span>
                                    <ArrowUpRight className="w-3 h-3 text-orange-300" />
                                </div>
                                <p className="text-xs text-orange-900 font-bold leading-relaxed">{p.descricao}</p>
                            </div>
                        )) : (
                            <p className="text-sm text-gray-400 font-medium italic">Nenhuma anomalia crítica detectada por lote.</p>
                        )}
                    </div>
                </AnalysisBlock>

                <AnalysisBlock title="Recomendações Práticas" icon={Zap} color="text-green-600">
                    <div className="space-y-4">
                        {analysis.recomendacoes.length > 0 ? analysis.recomendacoes.map((r: any, i: number) => (
                            <div key={i} className="bg-green-50/50 p-5 rounded-2xl border border-green-100/50">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="bg-white px-2.5 py-1 rounded-lg text-[10px] font-black text-green-600 border border-green-100 shadow-sm uppercase tracking-wider">
                                        {r.lote}
                                    </span>
                                    <Lightbulb className="w-3 h-3 text-green-300" />
                                </div>
                                <p className="text-xs text-green-900 font-bold leading-relaxed">{r.acao}</p>
                            </div>
                        )) : (
                            <p className="text-sm text-gray-400 font-medium italic">Monitoramento padrão mantido.</p>
                        )}
                    </div>
                </AnalysisBlock>
            </div>
        </div>
    );
};
