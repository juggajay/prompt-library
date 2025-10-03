/**
 * DocReader Service
 * Handles all API calls for the doc-reader feature
 */

export interface Guide {
  id: string;
  title: string;
  source_url: string;
  processing_status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  error_message?: string;
  content?: {
    processed_content: string;
    raw_content: string;
    metadata?: any;
  };
}

export interface ProcessUrlResponse {
  id: string;
  message: string;
}

export interface GuidesListResponse {
  guides: Guide[];
}

/**
 * Get authorization header with current session token
 */
async function getAuthHeader(): Promise<Record<string, string>> {
  // Import dynamically to avoid circular dependencies
  const { supabase } = await import('../lib/supabase');
  const { data: { session } } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  return headers;
}

/**
 * Process a documentation URL
 */
export async function processUrl(url: string): Promise<ProcessUrlResponse> {
  const headers = await getAuthHeader();

  const response = await fetch('/api/doc-reader/process', {
    method: 'POST',
    headers,
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to process URL');
  }

  return response.json();
}

/**
 * Fetch all guides for the current user
 */
export async function fetchGuides(): Promise<GuidesListResponse> {
  const headers = await getAuthHeader();

  const response = await fetch('/api/doc-reader/guides', {
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch guides');
  }

  return response.json();
}

/**
 * Fetch a specific guide by ID
 */
export async function fetchGuide(guideId: string): Promise<Guide> {
  const headers = await getAuthHeader();

  const response = await fetch(`/api/doc-reader/guides/${guideId}`, {
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch guide');
  }

  return response.json();
}

/**
 * Delete a guide
 */
export async function deleteGuide(guideId: string): Promise<void> {
  const headers = await getAuthHeader();

  const response = await fetch(`/api/doc-reader/guides/${guideId}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete guide');
  }
}
