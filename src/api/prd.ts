import { supabase } from '../lib/supabase';
import type {
  GeneratePRDParams,
  GeneratePRDResponse,
  PRDDocument,
  PRDTemplate,
} from '../types';

async function getAuthToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('You must be signed in to use the PRD generator.');
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

  return fetch(input, { ...init, headers });
}

export async function fetchTemplates(): Promise<{ templates: PRDTemplate[]; isDefault: boolean }> {
  const response = await fetchWithAuth('/api/prd-templates');

  if (!response.ok) {
    throw new Error('Failed to load templates');
  }

  return response.json();
}

export async function createTemplate(template: Partial<PRDTemplate>): Promise<PRDTemplate> {
  const response = await fetchWithAuth('/api/prd-templates', {
    method: 'POST',
    body: JSON.stringify(template),
  });

  if (!response.ok) {
    const message = await safeJson(response);
    throw new Error(message?.error || 'Failed to save template');
  }

  const data = await response.json();
  return data.template as PRDTemplate;
}

export async function generatePRD(params: GeneratePRDParams): Promise<GeneratePRDResponse> {
  const response = await fetchWithAuth('/api/generate-prd', {
    method: 'POST',
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const message = await safeJson(response);
    throw new Error(message?.error || 'Generation failed');
  }

  return response.json();
}

export async function listDocuments(): Promise<PRDDocument[]> {
  const { data, error } = await supabase
    .from('prd_documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as PRDDocument[];
}

export async function getDocument(id: string): Promise<PRDDocument> {
  const { data, error } = await supabase
    .from('prd_documents')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as PRDDocument;
}

export async function updateDocument(id: string, updates: Partial<PRDDocument>): Promise<PRDDocument> {
  const { data, error } = await supabase
    // @ts-ignore - Supabase typing mismatch
    .from('prd_documents')
    .update({
      ...updates,
      updated_at: undefined, // triggers managed by database
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as PRDDocument;
}

export async function deleteDocument(id: string): Promise<void> {
  const { error } = await supabase.from('prd_documents').delete().eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function exportDocument(
  documentId: string,
  format: 'markdown' | 'pdf' | 'docx'
): Promise<Blob> {
  const response = await fetchWithAuth('/api/export-prd', {
    method: 'POST',
    body: JSON.stringify({ documentId, format }),
  });

  if (!response.ok) {
    const message = await safeJson(response);
    throw new Error(message?.error || 'Failed to export PRD');
  }

  const arrayBuffer = await response.arrayBuffer();
  let mime = 'application/octet-stream';

  if (format === 'markdown') {
    mime = 'text/markdown';
  } else if (format === 'pdf') {
    mime = 'application/pdf';
  } else if (format === 'docx') {
    mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }

  return new Blob([arrayBuffer], { type: mime });
}

export async function optimizePRD(params: {
  prdContent?: Record<string, unknown>;
  conversationHistory?: Array<{ role: string; content: string }>;
  userMessage: string;
  sessionContext?: {
    goal?: string;
    targetAudience?: string;
    stage?: string;
  };
}): Promise<{
  success: boolean;
  result: {
    summary: string;
    improvements: Array<{
      section: string;
      issue: string;
      recommendation: string;
      benefit: string;
    }>;
    suggested_rewrite: string | null;
    metrics: string[];
    risks: string[];
    next_actions: string[];
    follow_up_question: string;
  };
  tokensUsed: number;
}> {
  const response = await fetchWithAuth('/api/optimize-prd', {
    method: 'POST',
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const message = await safeJson(response);
    throw new Error(message?.error || 'Optimization failed');
  }

  return response.json();
}

async function safeJson(response: Response): Promise<any | null> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
