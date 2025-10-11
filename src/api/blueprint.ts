import { supabase } from '../lib/supabase';
import type {
  BlueprintResponse,
  CLITaskResponse,
  CreateBlueprintPayload,
  GenerateTasksPayload,
  CLITask,
} from '../types';

async function getAuthToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('You need to be signed in to generate project plans.');
  }

  return session.access_token;
}

async function fetchWithAuth(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = await getAuthToken();
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(input, { ...init, headers });
  if (!response.ok) {
    const message = await safeJson(response);
    throw new Error(message?.error || 'Request failed');
  }

  return response;
}

export async function generateBlueprint(payload: CreateBlueprintPayload): Promise<BlueprintResponse> {
  const response = await fetchWithAuth('/api/generate-blueprint', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response.json();
}

export async function generateCLITasks(payload: GenerateTasksPayload): Promise<CLITaskResponse> {
  const response = await fetchWithAuth('/api/generate-cli-tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response.json();
}

export async function saveCLITasks(blueprintId: string, tasks: CLITask[]) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('You must be signed in to save tasks.');
  }

  const { error } = await supabase.from('project_tasks').insert(
    tasks.map((task) => ({
      blueprint_id: blueprintId,
      user_id: user.id,
      title: task.title,
      description: task.description,
      cli_prompt: task.cliPrompt,
      status: task.status,
      metadata: {
        tags: task.tags,
        effort: task.effort,
      },
    }))
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function safeJson(response: Response): Promise<any | null> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
