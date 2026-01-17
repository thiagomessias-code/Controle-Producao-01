import { useState, useEffect } from "react";
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
    password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
});

export default function ResetPassword() {
    const [, setLocation] = useLocation();
    const { resetPassword } = useAuth();
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const t = params.get("token");
        if (!t) {
            toast.error("Token de recuperação ausente!");
            setLocation("/login");
        } else {
            setToken(t);
        }
    }, [setLocation]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!token) return;
        setLoading(true);
        try {
            await resetPassword({ token, newPassword: values.password });
            toast.success("Senha redefinida com sucesso!");
            setLocation("/login");
        } catch (err) {
            form.setError("root", { message: "Erro ao redefinir senha. O link pode ter expirado." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f97316] flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-none shadow-2xl bg-white/95 backdrop-blur-sm relative overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-orange-400 to-orange-600" />
                <CardHeader className="pt-8 pb-4">
                    <CardTitle className="text-2xl font-black text-gray-900 text-center">Criar Nova Senha</CardTitle>
                    <CardDescription className="text-gray-500 font-medium text-center pt-2">
                        Escolha uma senha forte para sua segurança.
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
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-700 font-bold ml-1">Nova Senha</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                {...field}
                                                disabled={loading}
                                                className="rounded-xl border-2 border-gray-100 h-12"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-700 font-bold ml-1">Confirmar Senha</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
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
                                Redefinir Minha Senha
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
