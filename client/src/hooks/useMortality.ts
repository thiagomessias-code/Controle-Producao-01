import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  mortalityApi,
  Mortality,
  CreateMortalityRequest,
  UpdateMortalityRequest,
} from "@/api/mortality";

export const useMortality = (entityId?: string, isBatch: boolean = false) => {
  const queryClient = useQueryClient();

  const { data: mortalities = [], isLoading, error } = useQuery({
    queryKey: entityId ? ["mortality", entityId, isBatch] : ["mortality"],
    queryFn: () =>
      entityId ? (isBatch ? mortalityApi.getByBatchId(entityId) : mortalityApi.getByGroupId(entityId)) : mortalityApi.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateMortalityRequest) => mortalityApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: entityId ? ["mortality", entityId, isBatch] : ["mortality"],
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMortalityRequest }) =>
      mortalityApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: entityId ? ["mortality", entityId, isBatch] : ["mortality"],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mortalityApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: entityId ? ["mortality", entityId, isBatch] : ["mortality"],
      });
    },
  });

  return {
    mortalities,
    isLoading,
    error,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
