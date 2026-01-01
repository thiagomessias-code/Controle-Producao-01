import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  productionApi,
  Production,
  CreateProductionRequest,
  UpdateProductionRequest,
} from "@/api/production";
import { incubationApi, CreateIncubationRequest } from "@/api/incubation";
import { groupsApi } from "@/api/groups";
import { nanoid } from "nanoid";
import { addDays, format } from "date-fns";

export const useProduction = (entityId?: string, isBatch: boolean = false) => {
  const queryClient = useQueryClient();

  const { data: productions = [], isLoading, error } = useQuery({
    queryKey: entityId ? ["production", entityId, isBatch] : ["production"],
    queryFn: () =>
      entityId ? (isBatch ? productionApi.getByBatchId(entityId) : productionApi.getByGroupId(entityId)) : productionApi.getAll(),
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateProductionRequest) => {
      // 1. Register the production first
      const newProduction = await productionApi.create(data);

      // 2. Handle destination logic
      if (data.destination === "Incubação") {
        // a. Check for active incubation
        const allIncubations = await incubationApi.getAll();
        const activeIncubation = allIncubations.find(
          (inc) => inc.status === "incubating"
        );

        if (activeIncubation) {
          // b. If active, add eggs
          await incubationApi.update(activeIncubation.id, {
            eggQuantity: activeIncubation.eggQuantity + data.quantity,
          });
        } else {
          // c. If not active, create a new one (Incubation Batch)
          const startDate = new Date(data.date);
          const expectedHatchDate = format(addDays(startDate, 21), "yyyy-MM-dd"); // Assuming 21 days for quail

          const newIncubationBatch: CreateIncubationRequest = {
            batchNumber: `INC-${nanoid(6).toUpperCase()}`,
            eggQuantity: data.quantity,
            startDate: data.date,
            expectedHatchDate: expectedHatchDate,
            temperature: 37.5, // Default value
            humidity: 60, // Default value
            species: 'Codorna', // Default if not specified
            notes: `Criado automaticamente a partir da produção do grupo ${data.groupId}`,
          };

          await incubationApi.create(newIncubationBatch);
        }
      }

      // 3. Invalidate queries
      return newProduction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: entityId ? ["production", entityId, isBatch] : ["production"],
      });
      // Invalidate incubation queries as well
      queryClient.invalidateQueries({ queryKey: ["incubation"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductionRequest }) =>
      productionApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: entityId ? ["production", entityId, isBatch] : ["production"],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productionApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: entityId ? ["production", entityId, isBatch] : ["production"],
      });
    },
  });

  return {
    productions,
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
