import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  incubationApi,
  Incubation,
  CreateIncubationRequest,
  UpdateIncubationRequest,
} from "@/api/incubation";

export const useIncubation = () => {
  const queryClient = useQueryClient();

  const { data: incubations = [], isLoading, error } = useQuery({
    queryKey: ["incubation"],
    queryFn: () => incubationApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateIncubationRequest) => incubationApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incubation"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIncubationRequest }) =>
      incubationApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["incubation"] });
      queryClient.invalidateQueries({ queryKey: ["incubation", variables.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => incubationApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incubation"] });
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => // Type 'any' for now or define FinalizeRequest
      incubationApi.finalize(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incubation"] });
    },
  });

  return {
    incubations,
    isLoading,
    error,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    finalize: finalizeMutation.mutateAsync, // Expose finalize
    delete: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isFinalizing: finalizeMutation.isPending, // Expose loading state
    isDeleting: deleteMutation.isPending,
  };
};

export const useIncubationById = (id: string) => {
  const { data: incubation, isLoading, error } = useQuery({
    queryKey: ["incubation", id],
    queryFn: () => incubationApi.getById(id),
    enabled: !!id,
  });

  return { incubation, isLoading, error };
};
