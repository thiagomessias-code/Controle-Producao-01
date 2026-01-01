import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { salesApi, Sale, CreateSaleRequest, UpdateSaleRequest } from "@/api/sales";

export const useSales = (entityId?: string, isBatch: boolean = false) => {
  const queryClient = useQueryClient();

  const { data: sales = [], isLoading, error } = useQuery({
    queryKey: entityId ? ["sales", entityId, isBatch] : ["sales"],
    queryFn: () =>
      entityId ? salesApi.getByGroupId(entityId) : salesApi.getAll(),
    enabled: !entityId || !!entityId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateSaleRequest) => salesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: entityId ? ["sales", entityId, isBatch] : ["sales"],
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSaleRequest }) =>
      salesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: entityId ? ["sales", entityId, isBatch] : ["sales"],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => salesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: entityId ? ["sales", entityId, isBatch] : ["sales"],
      });
    },
  });

  return {
    sales,
    isLoading,
    error,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
