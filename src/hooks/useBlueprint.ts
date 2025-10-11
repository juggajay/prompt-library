import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as blueprintApi from '../api/blueprint';
import type {
  BlueprintResponse,
  CLITaskResponse,
  CreateBlueprintPayload,
  GenerateTasksPayload,
} from '../types';

export function useGenerateBlueprint() {
  return useMutation<BlueprintResponse, Error, CreateBlueprintPayload>({
    mutationFn: (payload) => blueprintApi.generateBlueprint(payload),
    onMutate: () => {
      toast.loading('Drafting your project blueprint...', { id: 'blueprint' });
    },
    onSuccess: () => {
      toast.success('Blueprint ready! Review the plan and tweak as needed.', { id: 'blueprint' });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to generate blueprint', { id: 'blueprint' });
    },
  });
}

export function useGenerateTasks() {
  return useMutation<CLITaskResponse, Error, GenerateTasksPayload>({
    mutationFn: (payload) => blueprintApi.generateCLITasks(payload),
    onMutate: () => {
      toast.loading('Asking the AI to draft CLI-friendly tasks...', { id: 'cli-tasks' });
    },
    onSuccess: () => {
      toast.success('Task list ready! Copy prompts straight into your CLI.', { id: 'cli-tasks' });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to generate tasks', { id: 'cli-tasks' });
    },
  });
}

export function useSaveCLITasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ blueprintId, tasks }: { blueprintId: string; tasks: CLITaskResponse['tasks'] }) =>
      blueprintApi.saveCLITasks(blueprintId, tasks),
    onSuccess: (_, { blueprintId }) => {
      toast.success('Tasks saved to your project');
      queryClient.invalidateQueries({ queryKey: ['blueprints', blueprintId, 'tasks'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save tasks');
    },
  });
}
