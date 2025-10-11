import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as contextApi from '../api/context';
import type { GenerateContextPayload } from '../api/context';
import type { ContextPackage, ContextQuestion } from '../types';

export function useContextQuestions() {
  return useMutation<ContextQuestion[], Error, string>({
    mutationFn: (idea: string) => contextApi.generateContextQuestions(idea),
    onMutate: () => {
      toast.loading('Thinking through smart follow-up questions...', { id: 'context-questions' });
    },
    onSuccess: () => {
      toast.success('Here are a few quick questions to clarify the project.', { id: 'context-questions' });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create questions', { id: 'context-questions' });
    },
  });
}

export function useContextPackage() {
  return useMutation<ContextPackage, Error, GenerateContextPayload>({
    mutationFn: (payload) => contextApi.generateContextPackage(payload),
    onMutate: () => {
      toast.loading('Preparing your project context bundle...', { id: 'context-package' });
    },
    onSuccess: () => {
      toast.success('Context bundle is ready to use with your AI assistant!', { id: 'context-package' });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to generate context', { id: 'context-package' });
    },
  });
}
