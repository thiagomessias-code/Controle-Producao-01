import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { salesApi, Sale, CreateSaleRequest, UpdateSaleRequest } from "@/api/sales";

export const useSales = (groupId?: string) => {
  const queryClient = useQueryClient();

  const { data: sales = [], isLoading, error } = useQuery({
    queryKey: groupId ? ["sales", groupId] : ["sales"],
    queryFn: () =>
      groupId ? salesApi.getByGroupId(groupId) : salesApi.getAll(),
    enabled: !groupId || !!groupId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateSaleRequest) => salesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: groupId ? ["sales", groupId] : ["sales"],
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSaleRequest }) =>
      salesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: groupId ? ["sales", groupId] : ["sales"],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => salesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: groupId ? ["sales", groupId] : ["sales"],
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
