
import React from 'react';
import { ShieldAlert, Lightbulb, TrendingUp, ArrowRight } from 'lucide-react';

interface StrategyCardProps {
    type: 'priority' | 'efficiency' | 'prediction';
    title: string;
    description: string;
    action?: string;
    onClick?: () => void;
}

const StrategyCard: React.FC<StrategyCardProps> = ({ type, title, description, action, onClick }) => {
    const config = {
        priority: {
            icon: ShieldAlert,
            color: 'text-red-600',
            bg: 'bg-red-50',
            border: 'border-red-100',
            label: 'Ação Prioritária'
        },
        efficiency: {
            icon: Lightbulb,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            border: 'border-amber-100',
            label: 'Insight de Eficiência'
        },
        prediction: {
            icon: TrendingUp,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-100',
            label: 'Previsão de Dados'
        }
    };

    const { icon: Icon, color, bg, border, label } = config[type];

    return (
        <div
            onClick={onClick}
            className={`p-5 rounded-[24px] border-2 ${border} ${bg} transition-all hover:shadow-lg hover:-translate-y-1 duration-300 group cursor-pointer active:scale-95`}
        >
            <div className="flex items-center gap-2 mb-3">
                <div className={`p-2 rounded-xl bg-white shadow-sm ${color}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${color}`}>{label}</span>
            </div>
            <h4 className="text-sm font-black text-gray-900 mb-2 truncate">{title}</h4>
            <p className="text-xs text-gray-600 leading-relaxed mb-4 line-clamp-2">{description}</p>
            {action && (
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-900 group-hover:gap-3 transition-all">
                    {action} <ArrowRight className="w-3 h-3" />
                </div>
            )}
        </div>
    );
};

export const ReportsStrategy: React.FC<{ insights: string[], alerts: any[], onAction?: (type: string) => void }> = ({ insights, alerts, onAction }) => {
    // Generate strategy based on real data
    const criticalAlert = alerts.find(a => a.nivel === 'critical');

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StrategyCard
                type="priority"
                title={criticalAlert?.tipo || "Estabilidade Operacional"}
                description={criticalAlert?.mensagem || "Não detectamos alarmes críticos no momento. Mantenha os protocolos de higienização."}
                action="Ver Protocolos"
                onClick={() => onAction?.('priority')}
            />
            <StrategyCard
                type="efficiency"
                title="Otimização de Ração"
                description={insights[0] || "Considere ajustar o mix nutricional baseando-se no consumo observado na última semana."}
                action="Ajustar Nutrição"
                onClick={() => onAction?.('efficiency')}
            />
            <StrategyCard
                type="prediction"
                title="Projeção de Produção"
                description="Tendência de alta de 5% para a próxima semana baseada na curva de maturidade atual."
                action="Ver Gráfico"
                onClick={() => onAction?.('prediction')}
            />
        </div>
    );
};
