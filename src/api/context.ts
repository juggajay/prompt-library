import { supabase } from '../lib/supabase';
import type {
  ContextPackage,
  ContextQuestion,
} from '../types';

async function getAuthToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('You need to be signed in to use the project assistant.');
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

export async function generateContextQuestions(idea: string): Promise<ContextQuestion[]> {
  const response = await fetchWithAuth('/api/context-questions', {
    method: 'POST',
    body: JSON.stringify({ idea }),
  });

  return response.json();
}

export interface GenerateContextPayload {
  idea: string;
  answers: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
  preferences?: Record<string, unknown>;
}

export async function generateContextPackage(payload: GenerateContextPayload): Promise<ContextPackage> {
  const response = await fetchWithAuth('/api/context-package', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response.json();
}

async function safeJson(response: Response): Promise<any | null> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
