import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  mortalityApi,
  Mortality,
  CreateMortalityRequest,
  UpdateMortalityRequest,
} from "@/api/mortality";

export const useMortality = (groupId?: string) => {
  const queryClient = useQueryClient();

  const { data: mortalities = [], isLoading, error } = useQuery({
    queryKey: groupId ? ["mortality", groupId] : ["mortality"],
    queryFn: () =>
      groupId ? mortalityApi.getByGroupId(groupId) : mortalityApi.getAll(),
    enabled: !groupId || !!groupId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateMortalityRequest) => mortalityApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: groupId ? ["mortality", groupId] : ["mortality"],
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMortalityRequest }) =>
      mortalityApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: groupId ? ["mortality", groupId] : ["mortality"],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mortalityApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: groupId ? ["mortality", groupId] : ["mortality"],
      });
    },
  });

  return {
    mortalities,
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
