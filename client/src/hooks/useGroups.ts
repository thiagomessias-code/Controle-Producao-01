import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { groupsApi, CreateGroupRequest, UpdateGroupRequest } from "@/api/groups";

const CACHE_KEY = "groups_cache_v2";
const CACHE_DURATION = 5 * 60 * 1000;

export function useGroups() {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const fresh = await groupsApi.getAll();
      return Array.isArray(fresh) ? fresh : [];
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateGroupRequest) => groupsApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groups"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGroupRequest }) =>
      groupsApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groups"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => groupsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groups"] }),
  });

  return {
    groups: Array.isArray(data) ? data : [],
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
