import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabaseClient } from '@/api/supabaseClient';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
// wouter useLocation is not strictly needed if we force reload, but good to keep clean.
// Actually, window.location.href is better here to refresh the AppRoutes state.

export const ChangePassword = () => {
    const { user, logout } = useAuth();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');

        if (password.length < 6) {
            setMessage('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            setMessage('As senhas não coincidem.');
            return;
        }

        try {
            setLoading(true);
            await supabaseClient.post('/auth/change-password', { newPassword: password });

            // Update local storage to remove the flag
            // syncing with useAuth.ts which uses 'auth_user'
            if (user) {
                const updatedUser = { ...user, change_password_required: false };
                // useAuth.ts uses 'auth_user', but let's check what Login.tsx uses. 
                // useAuth.ts uses 'auth_user'.
                // I will update 'auth_user'.
                localStorage.setItem('auth_user', JSON.stringify(updatedUser));
            }

            alert('Senha alterada com sucesso!');

            // Role-based redirection logic
            const currentRole = user?.role || '';
            const isAdmin = currentRole.toLowerCase() === 'admin';

            // Force reload to refresh AppRoutes state and go to correct path
            if (isAdmin) {
                window.location.href = '/admin/';
            } else {
                window.location.href = '/';
            }
        } catch (error: any) {
            console.error('Erro ao alterar senha:', error);
            setMessage(error.response?.data?.message || 'Erro ao alterar senha.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f97316] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-black rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <Card className="w-full max-w-md border-none shadow-2xl bg-white/95 backdrop-blur-sm relative z-10 overflow-hidden">
                {/* Top warning bar */}
                <div className="h-2 bg-gradient-to-r from-red-500 to-orange-600" />

                <CardHeader className="pt-8 pb-4">
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-3 bg-orange-50 rounded-full animate-bounce">
                            <span className="text-3xl text-orange-600">🛡️</span>
                        </div>
                        <CardTitle className="text-3xl font-black text-gray-900 tracking-tight text-center">
                            Segurança Primeiro
                        </CardTitle>
                        <CardDescription className="text-gray-500 font-medium text-center">
                            Por ser seu primeiro acesso, você deve configurar uma senha definitiva.
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="px-8 pb-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {message && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100 animate-in slide-in-from-top-2">
                                ⚠️ {message}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="text-gray-700 font-bold ml-1 text-sm">Nova Senha</label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    required
                                    className="rounded-xl border-2 border-gray-100 focus:border-orange-500 h-12 transition-all mt-1"
                                />
                            </div>

                            <div>
                                <label className="text-gray-700 font-bold ml-1 text-sm">Confirmar Senha</label>
                                <Input
                                    type="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Repita a nova senha"
                                    required
                                    className="rounded-xl border-2 border-gray-100 focus:border-orange-500 h-12 transition-all mt-1"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            className="w-full h-14 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-xl font-bold text-lg shadow-lg shadow-orange-100 transition-all mt-4"
                            isLoading={loading}
                        >
                            {loading ? 'Processando...' : 'Salvar Senha e Entrar'}
                        </Button>

                        <div className="text-center mt-6">
                            <button
                                type="button"
                                onClick={logout}
                                className="text-gray-400 hover:text-gray-600 font-bold text-sm transition-colors hover:underline underline-offset-4 flex items-center justify-center gap-2 mx-auto"
                            >
                                <span>Sair e trocar depois</span>
                                <span className="text-lg">↩️</span>
                            </button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};
