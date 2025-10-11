import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as prdApi from '../api/prd';
import type { GeneratePRDParams, PRDDocument } from '../types';

export function usePRDTemplates() {
  return useQuery({
    queryKey: ['prd', 'templates'],
    queryFn: prdApi.fetchTemplates,
    staleTime: 1000 * 60 * 10,
  });
}

export function usePRDDocuments() {
  return useQuery({
    queryKey: ['prd', 'documents'],
    queryFn: prdApi.listDocuments,
    staleTime: 1000 * 30,
  });
}

export function useGeneratePRD() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: GeneratePRDParams) => prdApi.generatePRD(params),
    onMutate: () => {
      toast.loading('Generating your PRD...', { id: 'generate-prd' });
    },
    onSuccess: (data) => {
      toast.success('PRD ready! You can review and export it.', { id: 'generate-prd' });
      queryClient.invalidateQueries({ queryKey: ['prd', 'documents'] });
      return data;
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Something went wrong during generation.', { id: 'generate-prd' });
    },
  });
}

export function useUpdatePRD() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<PRDDocument> }) =>
      prdApi.updateDocument(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prd', 'documents'] });
      toast.success('PRD saved');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update PRD');
    },
  });
}

export function useDeletePRD() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => prdApi.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prd', 'documents'] });
      toast.success('PRD removed');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete PRD');
    },
  });
}

export function useExportPRD() {
  return useMutation({
    mutationFn: ({ documentId, format }: { documentId: string; format: 'markdown' | 'pdf' | 'docx' }) =>
      prdApi.exportDocument(documentId, format),
    onSuccess: () => {
      toast.success('Export generated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Export failed');
    },
  });
}
