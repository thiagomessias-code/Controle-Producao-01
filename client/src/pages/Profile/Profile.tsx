import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useLocation } from "wouter";

export default function Profile() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie suas informações pessoais
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
          <CardDescription>
            Seus dados de conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Nome
            </label>
            <p className="text-lg font-semibold text-foreground">{user.name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Email
            </label>
            <p className="text-lg font-semibold text-foreground">{user.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              ID da Conta
            </label>
            <p className="text-sm font-mono text-muted-foreground">{user.id}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Segurança</CardTitle>
          <CardDescription>
            Gerencie sua segurança
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setLocation("/change-password")}
          >
            Alterar Senha
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => alert("Funcionalidade em desenvolvimento")}
          >
            Ativar Autenticação de Dois Fatores
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sair da Conta</CardTitle>
          <CardDescription>
            Encerre sua sessão
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
          >
            Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
