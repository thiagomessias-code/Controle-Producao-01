import { useState } from "react";
import { useLocation } from "wouter";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";

const formSchema = z.object({
    email: z.string().email({ message: "E-mail inválido." }),
});

export default function ForgotPassword() {
    const [, setLocation] = useLocation();
    const { forgotPassword, isLoading: isAuthLoading } = useAuth();
    const [isSent, setIsSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setLoading(true);
        try {
            await forgotPassword(values.email);
            setIsSent(true);
            toast.success("E-mail de recuperação enviado!");
        } catch (err: any) {
            const apiError = err.response?.data?.message || err.message || "Erro desconhecido";
            form.setError("root", { message: `Falha: ${apiError}` });
        } finally {
            setLoading(false);
        }
    };

    if (isSent) {
        return (
            <div className="min-h-screen bg-[#f97316] flex items-center justify-center p-4">
                <Card className="w-full max-w-md border-none shadow-2xl bg-white/95 backdrop-blur-sm relative overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-orange-400 to-orange-600" />
                    <CardHeader className="pt-8 pb-4 text-center">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                            ✔
                        </div>
                        <CardTitle className="text-2xl font-black text-gray-900">E-mail Enviado!</CardTitle>
                        <CardDescription className="text-gray-500 font-medium pt-2">
                            Se o e-mail informado estiver cadastrado, você receberá um link de recuperação em instantes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-8 pb-8 text-center">
                        <Button
                            variant="primary"
                            className="w-full h-12 rounded-xl font-bold"
                            onClick={() => setLocation("/login")}
                        >
                            Voltar para Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f97316] flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-none shadow-2xl bg-white/95 backdrop-blur-sm relative overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-orange-400 to-orange-600" />
                <CardHeader className="pt-8 pb-4">
                    <CardTitle className="text-2xl font-black text-gray-900 text-center">Recuperar Senha</CardTitle>
                    <CardDescription className="text-gray-500 font-medium text-center pt-2">
                        Informe seu e-mail para receber o link de recuperação.
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            {form.formState.errors.root?.message && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100 animate-in slide-in-from-top-2">
                                    ⚠️ {form.formState.errors.root.message}
                                </div>
                            )}

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-700 font-bold ml-1">E-mail</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="seu@email.com"
                                                {...field}
                                                disabled={loading}
                                                className="rounded-xl border-2 border-gray-100 h-12"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full h-12 rounded-xl font-bold shadow-lg shadow-orange-200"
                                isLoading={loading}
                            >
                                Enviar Link de Recuperação
                            </Button>

                            <button
                                type="button"
                                className="w-full text-center text-gray-400 font-bold text-sm hover:text-orange-600 transition-colors"
                                onClick={() => setLocation("/login")}
                            >
                                Não, eu lembrei a senha
                            </button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
