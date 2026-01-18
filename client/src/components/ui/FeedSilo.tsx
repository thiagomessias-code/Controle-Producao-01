
import React from 'react';

interface SiloProps {
    name: string;
    current: number;
    max: number;
    unit?: string;
    color?: string;
}

export const FeedSilo: React.FC<SiloProps> = ({ name, current, max, unit = 'kg', color }) => {
    // If max is 0 or invalid, use a safe default to avoid NaN
    const safeMax = max > 0 ? max : 1000;
    // Calculate percentage, but ensure a minimum visual height of 2% if there is any stock
    const rawPercentage = (current / safeMax) * 100;
    const percentage = current > 0 ? Math.max(2, Math.min(100, rawPercentage)) : 0;

    // Theme color: reflect the ACTUAL level (percentage)
    const statusColor = rawPercentage > 60 ? '#22c55e' : rawPercentage > 15 ? '#f59e0b' : '#ef4444';
    const baseColor = color || statusColor;

    // Low stock indicator (pulse effect if < 10% or absolute low)
    const isLow = rawPercentage < 10 || (current < 50 && unit === 'kg');

    return (
        <div className="flex flex-col items-center space-y-3 p-5 bg-white rounded-[2.5rem] border border-orange-50/50 shadow-xl shadow-orange-100/20 hover:shadow-2xl hover:shadow-orange-200/30 transition-all duration-500 group min-w-[140px]">
            <div className={`relative w-24 h-44 bg-gray-50 rounded-t-[3rem] rounded-b-3xl border-4 border-white shadow-2xl overflow-hidden ${isLow && current > 0 ? 'ring-2 ring-red-400 ring-offset-2 animate-pulse' : ''}`}>

                {/* Metallic effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-transparent to-black/5 pointer-events-none z-30" />

                {/* Level visualization */}
                <div
                    className="absolute bottom-0 w-full transition-all duration-1000 ease-in-out"
                    style={{
                        height: `${percentage}%`,
                        background: `linear-gradient(180deg, ${baseColor} 0%, ${baseColor}dd 100%)`,
                        boxShadow: `0 -4px 15px ${baseColor}44`
                    }}
                >
                    {/* Liquid surface wave with animation support via CSS if needed, 
                        or just a stylized top edge */}
                    <div className="absolute -top-2 left-0 w-full h-4 bg-black/10 blur-sm rounded-full opacity-50" />
                    <div className="absolute -top-1 left-0 w-full h-2 bg-white/20 rounded-full" />

                    {/* Glossy Reflection */}
                    <div className="absolute top-0 left-2 w-4 h-full bg-white/10 blur-md z-10" />
                </div>

                {/* Quantity Text Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-40 pointer-events-none">
                    <div className="bg-white/90 backdrop-blur-md px-2 py-1.5 rounded-2xl shadow-lg border border-white/50 transform group-hover:scale-110 transition-transform duration-500 min-w-[60px]">
                        <span className="text-lg font-black text-gray-900 leading-none block text-center">
                            {current.toLocaleString('pt-BR')}
                        </span>
                        <span className="text-[7px] font-black text-gray-400 uppercase tracking-[0.2em] text-center block mt-1">
                            {unit === 'kg' ? 'Quilos' : unit}
                        </span>
                    </div>
                </div>

                {/* Glass effect reflection */}
                <div className="absolute top-0 right-4 w-6 h-full bg-white/10 skew-x-[-15deg] z-20 pointer-events-none" />
            </div>

            <div className="text-center space-y-2">
                <div className="px-3 py-1 bg-gray-50 rounded-full inline-block">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]">{name}</p>
                </div>
                <div className="flex flex-col items-center">
                    <p className="text-xl font-black text-gray-900 leading-none">
                        {current.toLocaleString('pt-BR')}
                        <span className="text-[10px] font-bold text-gray-400 ml-1 uppercase">{unit}</span>
                    </p>
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1 opacity-60">
                        de {safeMax.toLocaleString('pt-BR')} {unit}
                    </p>
                </div>
            </div>
        </div>
    );
};
