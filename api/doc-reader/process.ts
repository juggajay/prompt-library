import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { Inngest } from 'inngest';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

// Create Inngest client
const inngest = new Inngest({
  id: 'doc-reader',
  name: 'Documentation Reader',
});

// Simple URL hash function
function hashURL(url: string): string {
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
function isValidURL(urlString: string): boolean {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get auth token from header
    const authHeader = req.headers.authorization;
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
        .eq('source_url', url)
        .eq('user_id', user.id)
        .eq('processing_status', 'completed')
        .single();

      if (existing) {
        return res.status(200).json({
          id: existing.id,
          status: 'completed',
          title: existing.title,
          message: 'Guide already exists',
        });
      }
    }

    // Create new guide record
    const { data: guide, error: createError } = await supabase
      .from('guides')
      .insert({
        source_url: url,
        source_hash: urlHash,
        user_id: user.id,
        processing_status: 'queued',
        ai_provider: 'openai',
        ai_model: 'gpt-4o',
      })
      .select()
      .single();

    if (createError) {
      console.error('Failed to create guide:', createError);
      return res.status(500).json({
        error: 'Failed to create guide',
        code: 'CREATE_FAILED',
      });
    }

    // Queue background processing job
    await inngest.send({
      name: 'guide/process.requested',
      data: {
        guideId: guide.id,
        url,
        userId: user.id,
      },
    });

    return res.status(202).json({
      id: guide.id,
      status: 'queued',
      message: 'Processing started',
    });
  } catch (error) {
    console.error('Error processing URL:', error);

    if (error instanceof SyntaxError) {
      return res.status(400).json({
        error: 'Invalid JSON',
        code: 'INVALID_JSON',
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}
