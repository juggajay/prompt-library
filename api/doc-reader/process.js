import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

// Simple URL hash function
function hashURL(url) {
  let hash = 0;
  const str = new URL(url).href;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Simple URL validation
function isValidURL(urlString) {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  console.log('[PROCESS API] Request received:', req.method, req.url);

  if (req.method !== 'POST') {
    console.log('[PROCESS API] Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[PROCESS API] Processing POST request...');

    // Get auth token from header
    const authHeader = req.headers.authorization;
    console.log('[PROCESS API] Auth header present:', !!authHeader);

    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
    }

    // Parse and validate request
    const { url, forceRefresh = false } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        error: 'URL is required',
        code: 'INVALID_REQUEST',
      });
    }

    if (!isValidURL(url)) {
      return res.status(400).json({
        error: 'Please enter a valid URL',
        code: 'INVALID_REQUEST',
      });
    }

    const urlHash = hashURL(url);

    // Check if URL already processed (unless force refresh)
    if (!forceRefresh) {
      const { data: existing } = await supabase
        .from('guides')
        .select('id, processing_status, title')
        .eq('url', url)
        .eq('user_id', user.id)
        .eq('processing_status', 'completed')
        .maybeSingle();

      if (existing) {
        console.log('[PROCESS API] Guide already exists:', existing.id);
        return res.status(200).json({
          id: existing.id,
          status: 'completed',
          title: existing.title,
          message: 'Guide already exists',
        });
      }
    }

    // Create new guide record
    const { data: guide, error: createError} = await supabase
      .from('guides')
      .insert({
        url: url,
        user_id: user.id,
        processing_status: 'queued',
      })
      .select()
      .single();

    if (createError) {
      console.error('[PROCESS API] Failed to create guide:', createError);
      return res.status(500).json({
        error: 'Failed to create guide',
        code: 'CREATE_FAILED',
        details: createError.message,
      });
    }

    console.log('[PROCESS API] Guide created successfully:', guide.id);

    // Start processing asynchronously (don't wait for completion)
    // Import dynamically to avoid issues
    import('./lib/processor.js')
      .then(({ processDocumentation }) => {
        return processDocumentation(url, guide.id, supabase);
      })
      .then(() => {
        console.log('[PROCESS API] Background processing completed for guide:', guide.id);
      })
      .catch((error) => {
        console.error('[PROCESS API] Background processing failed:', error);
      });

    // Return immediately with queued status
    return res.status(202).json({
      id: guide.id,
      status: 'queued',
      message: 'Processing started',
    });
  } catch (error) {
    console.error('[PROCESS API] Error processing URL:', error);

    if (error instanceof SyntaxError) {
      return res.status(400).json({
        error: 'Invalid JSON',
        code: 'INVALID_JSON',
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error.message,
    });
  }
}
