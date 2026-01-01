import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button'; // REMOVED
// import { Input } from '@/components/ui/input'; // REMOVED
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { reportsApi } from '@/api/reports';

export const ReportsChat: React.FC = () => {
    const [messages, setMessages] = useState<{ role: string, content: string }[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const context = messages.slice(-5);
            const res = await reportsApi.chat(userMsg.content, context);
            const aiMsg = { role: 'assistant', content: res.message.content };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, a IA está momentaneamente indisponível.' }]);
        } finally {
            setLoading(false);
        }
    };

    const suggestions = [
        "Como reduzir a mortalidade?",
        "Qual o lucro da última semana?",
        "Dicas para aumentar produção",
        "Análise de consumo de ração"
    ];

    return (
        <div className="flex flex-col h-[650px] bg-white/40 backdrop-blur-xl rounded-[32px] border border-white/60 shadow-2xl overflow-hidden group">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-md">
                        <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white tracking-tight">Especialista IA</h3>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-[10px] font-bold text-blue-100 uppercase tracking-widest">Online agora</span>
                        </div>
                    </div>
                </div>
                <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-700">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-400/20 blur-3xl rounded-full"></div>
                            <Bot className="w-20 h-20 text-blue-600 relative z-10" />
                        </div>
                        <div className="text-center space-y-2">
                            <h4 className="text-xl font-black text-gray-900">Como posso ajudar hoje?</h4>
                            <p className="text-gray-500 text-sm font-medium px-10">
                                Sou seu copiloto na gestão da granja. Pergunte sobre qualquer dado ou peça uma análise estratégica.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 w-full px-4">
                            {suggestions.map((text, i) => (
                                <button
                                    key={i}
                                    onClick={() => { setInput(text); }}
                                    className="p-3 text-[11px] font-bold text-gray-600 bg-white/60 border border-white hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all rounded-2xl text-left leading-tight"
                                >
                                    {text}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-500`}>
                        <div className={`max-w-[80%] p-4 rounded-3xl shadow-sm ${msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white/80 backdrop-blur-md rounded-bl-none border border-white text-gray-800'
                            }`}>
                            <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start animate-pulse">
                        <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl rounded-bl-none flex gap-1">
                            <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                            <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-6 bg-white/40 backdrop-blur-md border-t border-white/60">
                <div className="relative flex items-center">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Pergunte qualquer coisa..."
                        disabled={loading}
                        className="w-full bg-white/80 border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 h-14 pl-6 pr-16 rounded-2xl text-sm font-medium outline-none shadow-sm transition-all"
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className="absolute right-2 w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
