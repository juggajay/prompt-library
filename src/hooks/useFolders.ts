import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as foldersApi from '../api/folders';
import type { CreateFolderData, UpdateFolderData } from '../types';

export function useFolders() {
  return useQuery({
    queryKey: ['folders'],
    queryFn: () => foldersApi.getFolders(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useFolder(id: string) {
  return useQuery({
    queryKey: ['folders', id],
    queryFn: () => foldersApi.getFolderById(id),
    enabled: !!id,
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFolderData) => foldersApi.createFolder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast.success('Folder created successfully!');
    },
    onError: (error: Error) => {
      toast.error('Failed to create folder: ' + error.message);
    },
  });
}

export function useUpdateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateFolderData }) =>
      foldersApi.updateFolder(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast.success('Folder updated successfully!');
    },
    onError: (error: Error) => {
      toast.error('Failed to update folder: ' + error.message);
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => foldersApi.deleteFolder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      toast.success('Folder deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete folder: ' + error.message);
    },
  });
}

export function useFolderPromptCount(folderId: string) {
  return useQuery({
    queryKey: ['folders', folderId, 'count'],
    queryFn: () => foldersApi.getFolderPromptCount(folderId),
    enabled: !!folderId,
  });
}
