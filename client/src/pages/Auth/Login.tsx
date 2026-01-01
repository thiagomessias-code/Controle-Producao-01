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
  email: z.string().email({ message: "E-mail inválido." }),
  password: z.string().min(1, { message: "A senha é obrigatória." }),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, isLoading } = useAuth();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const { user } = await login(values);
      console.log('DEBUG LOGIN - User:', user);
      console.log('DEBUG LOGIN - Role:', user?.role);

      if (user?.change_password_required) {
        console.log('Redirecting to Change Password...');
        setLocation("/change-password");
        return;
      }

      const role = user?.role?.toLowerCase();
      // alert(`LOGIN DEBUG: Role detected is [${role}]`); // Remove debug alert

      if (role === 'admin') {
        console.log('Redirecting to ADMIN...');
        window.location.href = "/admin/";
      } else {
        console.log('Redirecting to APP...');
        setLocation("/");
      }
    } catch (err) {
      form.setError("root", { message: "Erro ao fazer login. Tente novamente." });
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
        {/* Top orange bar */}
        <div className="h-2 bg-gradient-to-r from-orange-400 to-orange-600" />

        <CardHeader className="pt-8 pb-4">
          <div className="flex flex-col items-center gap-4 mb-2">
            <div className="p-1 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full shadow-inner">
              <img
                src="/logo.jpg"
                alt="Logo"
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md animate-in fade-in zoom-in duration-500"
              />
            </div>
            <CardTitle className="text-3xl font-black text-gray-900 tracking-tight">
              Acesso Restrito
            </CardTitle>
            <CardDescription className="text-gray-500 font-medium text-center max-w-[250px]">
              Gerencie sua produção com a excelência das Codornas do Sertão
            </CardDescription>
          </div>
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
                    <FormLabel className="text-gray-700 font-bold ml-1">E-mail Corporativo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="nome@empresa.com"
                        {...field}
                        disabled={isLoading}
                        className="rounded-xl border-2 border-gray-100 focus:border-orange-500 focus:ring-orange-200 h-12 transition-all"
                      />
                    </FormControl>
                    <FormMessage className="text-xs font-medium" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-bold ml-1">Senha de Acesso</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        disabled={isLoading}
                        className="rounded-xl border-2 border-gray-100 focus:border-orange-500 focus:ring-orange-200 h-12 transition-all"
                      />
                    </FormControl>
                    <FormMessage className="text-xs font-medium" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full h-14 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-xl font-bold text-lg shadow-lg shadow-orange-200 transition-all hover:scale-[1.02] active:scale-[0.98] mt-2"
                isLoading={isLoading}
              >
                Entrar no Sistema
              </Button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-100"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-400 font-bold tracking-widest">OU</span>
                </div>
              </div>

              <div className="text-center space-y-3">
                <button
                  type="button"
                  onClick={() => setLocation("/forgot-password")}
                  className="text-gray-400 hover:text-orange-600 font-medium text-xs transition-colors block mx-auto"
                >
                  Esqueci minha senha
                </button>

                <button
                  type="button"
                  onClick={() => setLocation("/signup")}
                  className="text-orange-600 hover:text-orange-700 font-bold text-sm transition-colors decoration-2 hover:underline underline-offset-4"
                >
                  Solicitar Acesso (Criar Conta)
                </button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="absolute bottom-6 text-white/60 text-xs font-medium tracking-widest uppercase">
        © {new Date().getFullYear()} Codornas do Sertão • Sistema de Gestão
      </div>
    </div>
  );
}
