
import React from 'react';

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { Graphics } from '@/api/reports';

interface ReportsChartsProps {
    charts: Graphics[];
    onItemClick?: (id: string, name: string) => void;
}

const COLORS = ['#2563eb', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

export const ReportsCharts: React.FC<ReportsChartsProps> = ({ charts = [], onItemClick }) => {
    const renderChart = (chart: Graphics) => {
        switch (chart.chartType) {
            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chart.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                stroke="#94a3b8"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontWeight: 600 }}
                                dy={10}
                            />
                            <YAxis
                                stroke="#94a3b8"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontWeight: 600 }}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white/20 ring-1 ring-black/5">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
                                                <div className="flex items-baseline gap-1">
                                                    <p className="text-xl font-black text-gray-900">{(payload[0].value ?? 0).toLocaleString()}</p>
                                                    <span className="text-[10px] font-bold text-gray-400">unids</span>
                                                </div>
                                                {chart.tooltip && (
                                                    <p className="text-[10px] text-gray-500 mt-2 max-w-[180px] leading-tight font-medium bg-gray-50 p-2 rounded-lg">
                                                        {chart.tooltip}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#2563eb"
                                strokeWidth={4}
                                dot={{ fill: '#2563eb', r: 4, strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6, strokeWidth: 0, onClick: (e: any) => onItemClick && onItemClick(e.payload.name, e.payload.name) }}
                                animationDuration={1500}
                                animationEasing="ease-in-out"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                );
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chart.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 600 }} dy={10} />
                            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 600 }} />
                            <Tooltip
                                cursor={{ fill: '#f8fafc', radius: 8 }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white/20 ring-1 ring-black/5">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
                                                <p className="text-xl font-black text-gray-900">{(payload[0].value ?? 0).toLocaleString()}</p>
                                                {chart.tooltip && (
                                                    <p className="text-[10px] text-gray-500 mt-2 max-w-[180px] leading-tight font-medium bg-gray-50 p-2 rounded-lg">
                                                        {chart.tooltip}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar
                                dataKey="value"
                                fill="#2563eb"
                                radius={[6, 6, 0, 0]}
                                animationDuration={1500}
                                onClick={(data: any) => {
                                    if (onItemClick && data) {
                                        onItemClick(data.name, data.name);
                                    }
                                }}
                                className="cursor-pointer"
                            >
                                {(chart.data || []).map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                );
            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={chart.data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={85}
                                paddingAngle={5}
                                dataKey="value"
                                animationDuration={1500}
                            >
                                {(chart.data || []).map((_, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                        cornerRadius={8}
                                        className="cursor-pointer"
                                        onClick={() => onItemClick && onItemClick(chart.data[index].name, chart.data[index].name)}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', borderRadius: '16px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                );
            default:
                return null;
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
            {charts.map((chart) => (
                <div key={chart.id} className="bg-white rounded-[32px] shadow-sm hover:shadow-xl hover:shadow-blue-50/50 transition-all duration-500 border border-gray-100/50 flex flex-col group">
                    <div className="p-8 pb-0">
                        <div className="flex items-start justify-between mb-2">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">{chart.title}</h3>
                            <div className="w-2 h-2 rounded-full bg-blue-500 group-hover:animate-ping"></div>
                        </div>
                        {chart.insight && (
                            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{chart.insight}</p>
                        )}
                    </div>
                    <div className="p-8 pt-4 flex-1">
                        {renderChart(chart)}
                    </div>
                </div>
            ))}
        </div>
    );
};
