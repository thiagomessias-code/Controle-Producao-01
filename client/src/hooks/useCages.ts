import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cagesApi, CreateCageRequest, UpdateCageRequest } from "@/api/cages";

export const useCages = () => {
    const queryClient = useQueryClient();

    const { data: cages = [], isLoading, error } = useQuery({
        queryKey: ["cages"],
        queryFn: cagesApi.getAll,
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateCageRequest) => cagesApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cages"] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateCageRequest }) =>
            cagesApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cages"] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => cagesApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cages"] });
        },
    });

    return {
        cages,
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

export const useCageById = (id: string) => {
    const { data: cage, isLoading, error } = useQuery({
        queryKey: ["cages", id],
        queryFn: () => cagesApi.getById(id),
        enabled: !!id,
    });

    return { cage, isLoading, error };
};
