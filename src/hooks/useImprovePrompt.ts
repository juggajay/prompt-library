import { useMutation } from '@tanstack/react-query';
import type { ImprovementResult, ImprovementRequest } from '../types/improvement';

async function improvePrompt(request: ImprovementRequest): Promise<ImprovementResult> {
  const response = await fetch('/api/improve-prompt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to improve prompt');
  }

  return response.json();
}

export function useImprovePrompt() {
  return useMutation({
    mutationFn: improvePrompt,
  });
}
