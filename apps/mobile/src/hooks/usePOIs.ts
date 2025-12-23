import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import poisService, { GetPOIsParams } from '../services/pois';
import type { CreatePOIData } from '../types';
import { useMapStore } from '../store/map';

export function usePOIs(params?: GetPOIsParams) {
  const { userLocation, selectedCategoryId, searchQuery } = useMapStore();

  return useQuery({
    queryKey: ['pois', { ...params, userLocation, selectedCategoryId, searchQuery }],
    queryFn: () =>
      poisService.getPOIs({
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude,
        categoryId: selectedCategoryId || undefined,
        search: searchQuery || undefined,
        ...params,
      }),
    enabled: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function usePOI(id: string) {
  return useQuery({
    queryKey: ['poi', id],
    queryFn: () => poisService.getPOI(id),
    enabled: !!id,
  });
}

export function useMyPOIs() {
  return useQuery({
    queryKey: ['myPOIs'],
    queryFn: () => poisService.getMyPOIs(),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => poisService.getCategories(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useCreatePOI() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePOIData) => poisService.createPOI(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pois'] });
      queryClient.invalidateQueries({ queryKey: ['myPOIs'] });
    },
  });
}

export function useDeletePOI() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => poisService.deletePOI(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pois'] });
      queryClient.invalidateQueries({ queryKey: ['myPOIs'] });
    },
  });
}

export function useRatePOI() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, rating }: { id: string; rating: number }) =>
      poisService.ratePOI(id, rating),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['poi', id] });
      queryClient.invalidateQueries({ queryKey: ['pois'] });
    },
  });
}

export function useUploadImage() {
  return useMutation({
    mutationFn: (uri: string) => poisService.uploadImage(uri),
  });
}
