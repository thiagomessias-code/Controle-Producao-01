import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { batchesApi, CreateBatchRequest, UpdateBatchRequest } from "@/api/batches";

const CACHE_KEY = "batches_cache_v2";
const CACHE_DURATION = 5 * 60 * 1e3;

export function useBatches() {
  const queryClient = useQueryClient();

  const {
    data: batches,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["batches"],
    queryFn: async () => {
      const data = await batchesApi.getAll();
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateBatchRequest) => batchesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      refetch();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBatchRequest }) =>
      batchesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      refetch();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => batchesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      refetch();
    },
  });


  return {
    batches,
    isLoading,
    error,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    refetch
  };
}

export const useBatchById = (id: string) => {
  const { data: batch, isLoading, error } = useQuery({
    queryKey: ["batches", id],
    queryFn: () => batchesApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  return { batch, isLoading, error };
};

export const useBatchesByCageId = (cageId: string) => {
  const { data: batches, isLoading, error, refetch } = useQuery({
    queryKey: ["batches", "cage", cageId],
    queryFn: () => batchesApi.getByCageId(cageId),
    enabled: !!cageId,
  });

  return { batches, isLoading, error, refetch };
};
