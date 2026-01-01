import { useState } from "react";
import { useLocation } from "wouter";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

export default function ForgotPassword() {
    const [, setLocation] = useLocation();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulating API call
        setTimeout(() => {
            setIsLoading(false);
            setSubmitted(true);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-[#f97316] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-black rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <Card className="w-full max-w-md border-none shadow-2xl bg-white/95 backdrop-blur-sm relative z-10 overflow-hidden">
                {/* Top bar */}
                <div className="h-2 bg-gradient-to-r from-orange-400 to-orange-600" />

                <CardHeader className="pt-8 pb-4">
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-3 bg-orange-50 rounded-full">
                            <span className="text-3xl text-orange-600">🔑</span>
                        </div>
                        <CardTitle className="text-3xl font-black text-gray-900 tracking-tight text-center">
                            Recuperar Senha
                        </CardTitle>
                        <CardDescription className="text-gray-500 font-medium text-center">
                            {submitted
                                ? "Verifique seu e-mail para as instruções de recuperação."
                                : "Informe seu e-mail para receber as instruções de recuperação."}
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="px-8 pb-8">
                    {!submitted ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="text-gray-700 font-bold ml-1 text-sm">E-mail Cadastrado</label>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    required
                                    className="rounded-xl border-2 border-gray-100 focus:border-orange-500 h-12 transition-all mt-1"
                                />
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                className="w-full h-14 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-xl font-bold text-lg shadow-lg shadow-orange-100 transition-all"
                                isLoading={isLoading}
                            >
                                Enviar Instruções
                            </Button>
                        </form>
                    ) : (
                        <Button
                            onClick={() => setLocation("/login")}
                            variant="outline"
                            size="lg"
                            className="w-full h-14 border-2 border-orange-500 text-orange-600 hover:bg-orange-50 rounded-xl font-bold text-lg transition-all"
                        >
                            Voltar ao Login
                        </Button>
                    )}

                    {!submitted && (
                        <div className="text-center mt-6">
                            <button
                                type="button"
                                onClick={() => setLocation("/login")}
                                className="text-gray-400 hover:text-orange-600 font-bold text-sm transition-colors hover:underline underline-offset-4"
                            >
                                Voltar ao Login
                            </button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="absolute bottom-6 text-white/60 text-xs font-medium tracking-widest uppercase">
                © {new Date().getFullYear()} Codornas do Sertão • Gestão de Acesso
            </div>
        </div>
    );
}
