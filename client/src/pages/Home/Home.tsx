import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useGroups } from "@/hooks/useGroups";
import { useProduction } from "@/hooks/useProduction";
import { useSales } from "@/hooks/useSales";
import TodoList from "@/components/TodoList";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useAppStore } from "@/hooks/useAppStore";
import { useIncubation } from "@/hooks/useIncubation";
import { getDaysDifference } from "@/utils/date";
import { formatQuantity, formatCurrency } from "@/utils/format";

interface QuickAction {
  label: string;
  path: string;
  icon: string;
  color: string;
}

const quickActions: QuickAction[] = [
  { label: "Novo Grupo", path: "/groups/create", icon: "🐔", color: "bg-blue-100" },
  { label: "Registrar Produção", path: "/production/register", icon: "📊", color: "bg-green-100" },
  { label: "Registrar Venda", path: "/sales/register", icon: "💰", color: "bg-yellow-100" },
  { label: "Registrar Incubação", path: "/incubation/create", icon: "🥚", color: "bg-orange-100" },
  { label: "Registrar Abatimentos", path: "/mortality/register", icon: "⚠️", color: "bg-red-100" },
  { label: "Registrar Alimentação", path: "/feed", icon: "🌾", color: "bg-amber-100" },
  { label: "Caixas de Crescimento", path: "/groups/growth", icon: "📦", color: "bg-blue-100" },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { groups } = useGroups();
  const { productions } = useProduction();
  const { sales } = useSales();
  const { permission, requestPermission, sendNotification } = useNotifications();


  const safeGroups = Array.isArray(groups) ? groups : [];

  // Filter for active groups only for the dashboard
  const activeGroups = safeGroups.filter((g: any) => g.status === "active");

  const totalRevenue = (Array.isArray(sales) ? sales : []).reduce((acc: number, sale: any) => acc + sale.totalPrice, 0);
  const totalProduction = (Array.isArray(productions) ? productions : []).reduce((acc: number, prod: any) => acc + prod.quantity, 0);

  // Count birds only from active groups
  const totalBirds = activeGroups.reduce((acc: number, g: any) => acc + g.quantity, 0);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Welcome Section */}
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Bem-vindo, {user?.name || "Usuário"}! 👋
            </h1>
            <p className="text-muted-foreground">
              Gerencie sua fazenda de codornas com facilidade
            </p>
            {permission === "default" && (
              <Button variant="outline" size="sm" onClick={requestPermission} className="mt-2">
                🔔 Ativar Notificações
              </Button>
            )}
          </div>

          {/* 21-Day Hatch Notification */}
          {(() => {
            const { incubations } = useIncubation();
            const readyToHatch = (incubations || []).filter((inc: any) => {
              // Ignore if already transferred
              const hasTransferred = inc.history?.some((h: any) => h.event.includes("Transferência"));
              if (hasTransferred) return false;

              if (inc.status !== "incubating") return false;
              const days = getDaysDifference(new Date(inc.startDate), new Date());
              return days >= 21;
            });

            if (readyToHatch.length === 0) return null;

            return (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-pulse">
                <h3 className="text-lg font-bold text-green-800 flex items-center gap-2">
                  🐣 Eclosão Prevista!
                </h3>
                <p className="text-green-700 mb-3">
                  Você tem {readyToHatch.length} lote(s) com 21 dias ou mais. Verifique a eclosão agora.
                </p>
                <div className="flex flex-col gap-2">
                  {readyToHatch.map((inc: any) => (
                    <div key={inc.id} className="flex justify-between items-center bg-white p-2 rounded border border-green-100">
                      <span className="font-medium text-green-900">{inc.batchNumber}</span>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => setLocation(`/incubation/${inc.id}`)}
                      >
                        Ver Lote →
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Pending Tasks List */}


          {/* Quick Actions - Grid Layout */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.path}
                onClick={() => setLocation(action.path)}
                className={`${action.color} rounded-lg p-4 flex flex-col items-center justify-center gap-2 hover:shadow-lg transition-all duration-200 active:scale-95`}
              >
                <span className="text-3xl">{action.icon}</span>
                <span className="text-xs md:text-sm font-medium text-center text-foreground">
                  {action.label}
                </span>
              </button>
            ))}
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Grupos Ativos</p>
                <p className="text-3xl font-bold text-primary">{activeGroups.length}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {activeGroups.filter((g: any) => g.phase === "crescimento").length} em crescimento
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total de Aves</p>
                <p className="text-3xl font-bold text-primary">
                  {formatQuantity(totalBirds)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Em {activeGroups.length} grupo{activeGroups.length !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Produção Total</p>
                <p className="text-3xl font-bold text-primary">
                  {formatQuantity(totalProduction)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {productions.length} registro{productions.length !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(totalRevenue)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {sales.length} venda{sales.length !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Groups (Production Only) */}
          {activeGroups.filter((g: any) => g.phase !== "crescimento").length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">Lotes de Postura Recentes</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation("/groups")}
                >
                  Ver Todos
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeGroups
                  .filter((g: any) => g.phase !== "crescimento")
                  .slice(0, 3)
                  .map((group: any) => (
                    <Card
                      key={group.id}
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => setLocation(`/groups/${group.id}`)}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        <CardDescription>{group.species}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Quantidade:</span>
                            <span className="font-semibold text-primary">
                              {formatQuantity(group.quantity)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Fase:</span>
                            <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                              Postura
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Local:</span>
                            <span className="text-sm font-medium">{group.location}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {/* Recent Growth Boxes */}
          {activeGroups.filter((g: any) => g.phase === "crescimento").length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">Caixas de Crescimento Recentes</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation("/groups/growth")}
                >
                  Ver Todas
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeGroups
                  .filter((g: any) => g.phase === "crescimento")
                  .slice(0, 3)
                  .map((group: any) => (
                    <Card
                      key={group.id}
                      className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-500"
                      onClick={() => setLocation(`/groups/${group.id}`)}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        <CardDescription>{group.species}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Quantidade:</span>
                            <span className="font-semibold text-primary">
                              {formatQuantity(group.quantity)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Fase:</span>
                            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Crescimento
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Local:</span>
                            <span className="text-sm font-medium">{group.location}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {/* Empty State */}
        </div>
        <div className="lg:col-span-1">
          <TodoList />
        </div>
      </div>

      {
        safeGroups.length === 0 && (
          <div className="text-center py-12 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-foreground mb-4">Comece Agora! 🚀</p>
            <p className="text-muted-foreground mb-6">
              Crie seu primeiro grupo de codornas para começar a gerenciar sua fazenda
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setLocation("/groups/create")}
            >
              Criar Primeiro Grupo
            </Button>
          </div>
        )
      }
    </div >
  );
}
