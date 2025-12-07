import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { feedApi, Feed, CreateFeedRequest, UpdateFeedRequest } from "@/api/feed";

export const useFeed = (groupId?: string) => {
  const queryClient = useQueryClient();

  const { data: feeds = [], isLoading, error } = useQuery({
    queryKey: groupId ? ["feed", groupId] : ["feed"],
    queryFn: () =>
      groupId ? feedApi.getByGroupId(groupId) : feedApi.getAll(),
    enabled: !groupId || !!groupId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateFeedRequest) => feedApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: groupId ? ["feed", groupId] : ["feed"],
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFeedRequest }) =>
      feedApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: groupId ? ["feed", groupId] : ["feed"],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => feedApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: groupId ? ["feed", groupId] : ["feed"],
      });
    },
  });

  return {
    feeds,
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
