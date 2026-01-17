
import React from 'react';

interface SiloProps {
    name: string;
    current: number;
    max: number;
    unit?: string;
    color?: string;
}

export const FeedSilo: React.FC<SiloProps> = ({ name, current, max, unit = 'kg', color = '#3b82f6' }) => {
    const percentage = Math.min(100, Math.max(0, (current / max) * 100));

    // Determine status color based on percentage:
    // Green (> 60%), Yellow (20-60%), Red (< 20%)
    const fillColor = percentage > 60 ? '#22c55e' : percentage > 20 ? '#f59e0b' : '#ef4444';

    return (
        <div className="flex flex-col items-center space-y-3 p-5 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="relative w-24 h-40 bg-gray-50 rounded-t-[3rem] rounded-b-2xl border-4 border-gray-100 shadow-inner overflow-hidden group">
                {/* Glass effect reflection */}
                <div className="absolute top-0 left-4 w-2 h-full bg-white/10 skew-x-12 z-20 pointer-events-none" />

                {/* Level visualization */}
                <div
                    className="absolute bottom-0 w-full transition-all duration-1000 ease-in-out"
                    style={{
                        height: `${percentage}%`,
                        backgroundColor: fillColor,
                        boxShadow: `0 0 20px ${fillColor}44`
                    }}
                >
                    {/* Liquid surface wave */}
                    <div className="absolute -top-1 left-0 w-full h-2 bg-black/5 rounded-full" />

                    {/* Animated bubbles */}
                    <div className="absolute bottom-4 left-4 w-1 h-1 bg-white/20 rounded-full animate-bounce delay-75" />
                    <div className="absolute bottom-10 right-6 w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce" />
                    <div className="absolute bottom-20 left-8 w-1 h-1 bg-white/20 rounded-full animate-bounce delay-150" />
                </div>

                {/* Percentage Text Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                    <span className="text-xl font-black text-gray-900 drop-shadow-sm">
                        {percentage.toFixed(0)}%
                    </span>
                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Nível</span>
                </div>
            </div>

            <div className="text-center space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{name}</p>
                <p className="text-lg font-black text-gray-900 leading-none">
                    {current.toLocaleString('pt-BR')}
                    <span className="text-xs font-bold text-gray-400 ml-1 uppercase">{unit}</span>
                </p>
            </div>
        </div>
    );
};
