import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid guide ID' });
  }

  try {
    // Get auth token from header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
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
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      // Fetch guide with content
      const { data: guide, error: guideError } = await supabase
        .from('guides')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (guideError || !guide) {
        return res.status(404).json({ error: 'Guide not found' });
      }

      // Fetch content if completed
      let content = null;
      if (guide.processing_status === 'completed') {
        const { data: guideContent } = await supabase
          .from('guide_content')
          .select('processed_content, raw_content, metadata')
          .eq('guide_id', id)
          .single();

        content = guideContent;
      }

      return res.status(200).json({
        ...guide,
        content,
      });
    } else if (req.method === 'DELETE') {
      // Delete guide (cascades to content and chunks)
      const { error } = await supabase
        .from('guides')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Failed to delete guide:', error);
        return res.status(500).json({ error: 'Failed to delete guide' });
      }

      return res.status(200).json({ success: true });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error handling guide:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
