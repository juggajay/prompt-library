import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as promptsApi from '../api/prompts';
import type { CreatePromptData, UpdatePromptData, PromptFilters } from '../types';

export function usePrompts(filters: PromptFilters = {}) {
  return useQuery({
    queryKey: ['prompts', filters],
    queryFn: () => promptsApi.getPrompts(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function usePrompt(id: string) {
  return useQuery({
    queryKey: ['prompts', id],
    queryFn: () => promptsApi.getPromptById(id),
    enabled: !!id,
  });
}

export function useCreatePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePromptData) => promptsApi.createPrompt(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      toast.success('Prompt created successfully!');
    },
    onError: (error: Error) => {
      toast.error('Failed to create prompt: ' + error.message);
    },
  });
}

export function useUpdatePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdatePromptData }) =>
      promptsApi.updatePrompt(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      toast.success('Prompt updated successfully!');
    },
    onError: (error: Error) => {
      toast.error('Failed to update prompt: ' + error.message);
    },
  });
}

export function useDeletePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => promptsApi.deletePrompt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      toast.success('Prompt deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete prompt: ' + error.message);
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      promptsApi.toggleFavorite(id, isFavorite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
    },
    onError: (error: Error) => {
      toast.error('Failed to update favorite: ' + error.message);
    },
  });
}

export function useIncrementUsage() {
  return useMutation({
    mutationFn: (id: string) => promptsApi.incrementUsage(id),
  });
}
