import { useLocation } from "wouter";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const formSchema = z.object({
    name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
    email: z.string().email({ message: "E-mail inválido." }),
    password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
    confirmPassword: z.string().min(6, { message: "Confirme sua senha." }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
});

export default function Signup() {
    const [, setLocation] = useLocation();
    const { signup, isLoading } = useAuth();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            await signup({ email: values.email, password: values.password, name: values.name });
            alert("Conta criada com sucesso! Faça login para continuar.");
            setLocation("/login");
        } catch (err) {
            form.setError("root", { message: "Erro ao criar conta. Tente novamente." });
        }
    };

    return (
        <div className="min-h-screen bg-[#f97316] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-black rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <Card className="w-full max-w-md border-none shadow-2xl bg-white/95 backdrop-blur-sm relative z-10 overflow-hidden">
                {/* Top orange bar */}
                <div className="h-2 bg-gradient-to-r from-orange-400 to-orange-600" />

                <CardHeader className="pt-8 pb-4">
                    <div className="flex flex-col items-center gap-3">
                        <div className="p-1 bg-orange-50 rounded-full">
                            <img
                                src="/logo.jpg"
                                alt="Logo"
                                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                            />
                        </div>
                        <CardTitle className="text-3xl font-black text-gray-900 tracking-tight">Criar Conta</CardTitle>
                        <CardDescription className="text-gray-500 font-medium text-center">
                            Junte-se à excelência da Codornas do Sertão
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="px-8 pb-8">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            {form.formState.errors.root?.message && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100">
                                    ⚠️ {form.formState.errors.root.message}
                                </div>
                            )}

                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-700 font-bold ml-1">Nome Completo</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Como devemos lhe chamar?"
                                                {...field}
                                                disabled={isLoading}
                                                className="rounded-xl border-2 border-gray-100 focus:border-orange-500 h-11 transition-all"
                                            />
                                        </FormControl>
                                        <FormMessage className="text-xs font-medium" />
                                    </FormItem>
                                )}
                            />

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
                                                disabled={isLoading}
                                                className="rounded-xl border-2 border-gray-100 focus:border-orange-500 h-11 transition-all"
                                            />
                                        </FormControl>
                                        <FormMessage className="text-xs font-medium" />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-gray-700 font-bold ml-1">Senha</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    placeholder="••••••••"
                                                    {...field}
                                                    disabled={isLoading}
                                                    className="rounded-xl border-2 border-gray-100 focus:border-orange-500 h-11 transition-all"
                                                />
                                            </FormControl>
                                            <FormMessage className="text-xs font-medium" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-gray-700 font-bold ml-1">Confirmar</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    placeholder="••••••••"
                                                    {...field}
                                                    disabled={isLoading}
                                                    className="rounded-xl border-2 border-gray-100 focus:border-orange-500 h-11 transition-all"
                                                />
                                            </FormControl>
                                            <FormMessage className="text-xs font-medium" />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                className="w-full h-12 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-xl font-bold shadow-lg shadow-orange-100 transition-all mt-4"
                                isLoading={isLoading}
                            >
                                Criar minha Conta
                            </Button>

                            <div className="text-center mt-4">
                                <span className="text-gray-500 text-sm">Já possui cadastro? </span>
                                <button
                                    type="button"
                                    onClick={() => setLocation("/login")}
                                    className="text-orange-600 hover:text-orange-700 font-bold text-sm transition-colors hover:underline underline-offset-4"
                                >
                                    Faça login aqui
                                </button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
