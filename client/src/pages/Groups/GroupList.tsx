import { useState } from "react";
import { useLocation } from "wouter";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonGroupCard } from "@/components/SkeletonCard";
import { useGroups } from "@/hooks/useGroups";
import { formatQuantity } from "@/utils/format";

export default function GroupList() {
  const [, setLocation] = useLocation();
  const { groups, isLoading, isDeleting, delete: deleteGroup } = useGroups();
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja deletar este galpão/grupo?")) {
      deleteGroup(id);
    }
  };

  // Filter groups based on type filter
  const filteredGroups = (groups || []).filter((g) => {
    if (typeFilter && g.type !== typeFilter) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <div className="h-8 bg-gray-200 rounded w-48"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonGroupCard />
          <SkeletonGroupCard />
          <SkeletonGroupCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Galpões e Grupos 🏭
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus galpões e setores de produção (Grupos)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={() => setLocation("/groups/create")}
          >
            + Novo Galpão/Grupo
          </Button>
        </div>
      </div>

      {/* Setores Principais */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-foreground">Filtrar por Tipo</h2>
          {typeFilter && (
            <Button variant="ghost" size="sm" onClick={() => setTypeFilter(null)} className="text-red-600">
              Limpar Filtro ✕
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            className={`hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-amber-500 ${typeFilter === 'production' ? 'ring-2 ring-amber-500 bg-amber-50' : ''}`}
            onClick={() => setTypeFilter(typeFilter === 'production' ? null : 'production')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🥚 Produção
              </CardTitle>
              <CardDescription>
                Galpões de postura comercial
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className={`hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-500 ${typeFilter === 'males' ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
            onClick={() => setTypeFilter(typeFilter === 'males' ? null : 'males')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🐓 Machos
              </CardTitle>
              <CardDescription>
                Galpões de reprodutores machos
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className={`hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-pink-500 ${typeFilter === 'breeders' ? 'ring-2 ring-pink-500 bg-pink-50' : ''}`}
            onClick={() => setTypeFilter(typeFilter === 'breeders' ? null : 'breeders')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🧬 Reprodutoras
              </CardTitle>
              <CardDescription>
                Galpões de matrizes
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {filteredGroups.length === 0 ? (
        <EmptyState
          icon="🏭"
          title="Nenhum grupo encontrado"
          description={typeFilter
            ? `Nenhum galpão encontrado do tipo ${typeFilter}.`
            : "Comece criando um novo galpão ou grupo para organizar sua produção."}
          action={
            !typeFilter && (
              <Button
                variant="primary"
                onClick={() => setLocation("/groups/create")}
              >
                Criar Primeiro Grupo
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map((group) => (
            <Card key={group.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  <span className={`px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800`}>
                    {group.type === 'production' ? 'Produção' : group.type === 'males' ? 'Machos' : 'Reprodutoras'}
                  </span>
                </div>
                <CardDescription>{group.description || "Sem descrição"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Capacidade</p>
                    <p className="font-semibold">{formatQuantity(group.capacity)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tipo</p>
                    <p className="font-semibold capitalize">{group.type}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setLocation(`/groups/${group.id}`)}
                  >
                    Ver Gaiolas
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(group.id)}
                    isLoading={isDeleting}
                  >
                    Deletar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
