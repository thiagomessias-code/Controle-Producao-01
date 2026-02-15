import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { feedApi, FeedConsumption, CreateFeedRequest, UpdateFeedRequest } from "@/api/feed";

export const useFeed = (id?: string, isBatch: boolean = false) => {
  const queryClient = useQueryClient();

  const { data: feeds = [], isLoading, error } = useQuery({
    queryKey: id ? ["feed", id, isBatch] : ["feed"],
    queryFn: () => {
      if (!id) return feedApi.getAll();
      return isBatch ? feedApi.getByBatchId(id) : feedApi.getByGroupId(id);
    },
    enabled: true,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateFeedRequest) => feedApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: id ? ["feed", id, isBatch] : ["feed"],
      });
      // Also invalidate global feed if needed
      if (id) queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id: feedId, data }: { id: string; data: UpdateFeedRequest }) =>
      (feedApi as any).update(feedId, data), // Assuming update exists or will be added
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: id ? ["feed", id, isBatch] : ["feed"],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (feedId: string) => feedApi.delete(feedId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: id ? ["feed", id, isBatch] : ["feed"],
      });
    },
  });

  const { data: availableFeeds = [], isLoading: isLoadingTypes } = useQuery({
    queryKey: ["feed_types"],
    queryFn: () => feedApi.getFeedTypes(),
  });

  const resupplyMutation = useMutation({
    mutationFn: ({ id, quantity, userId }: { id: string; quantity: number; userId: string }) =>
      feedApi.resupply(id, quantity, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed_types"] });
    },
  });

  return {
    feeds,
    availableFeeds,
    isLoading: isLoading || isLoadingTypes,
    error,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    resupply: resupplyMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isResupplying: resupplyMutation.isPending,
  };
};
