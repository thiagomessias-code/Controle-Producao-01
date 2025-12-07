import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { groupsApi, CreateGroupRequest, UpdateGroupRequest } from "@/api/groups";

const CACHE_KEY = "groups_cache_v1";
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
      const cached = localStorage.getItem(CACHE_KEY);

      if (cached) {
        const { data, timestamp } = JSON.parse(cached);

        if (Date.now() - timestamp < CACHE_DURATION) {
          // Atualiza em background
          groupsApi.getAll().then((fresh) => {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
              data: Array.isArray(fresh) ? fresh : [],
              timestamp: Date.now()
            }));
            queryClient.setQueryData(["groups"], Array.isArray(fresh) ? fresh : []);
          });

          return Array.isArray(data) ? data : [];
        }
      }

      const fresh = await groupsApi.getAll();
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: Array.isArray(fresh) ? fresh : [],
        timestamp: Date.now()
      }));

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

  useEffect(() => {
    if (data) {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    }
  }, [data]);

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
