import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  console.log('[CHAT API] Request received:', req.method, req.url);

  if (req.method !== 'POST') {
    console.log('[CHAT API] Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get auth token from header
    const authHeader = req.headers.authorization;
    console.log('[CHAT API] Auth header present:', !!authHeader);

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

    // Parse request body
    const { guideId, question } = req.body;

    if (!guideId || typeof guideId !== 'string') {
      return res.status(400).json({
        error: 'Guide ID is required',
        code: 'INVALID_REQUEST',
      });
    }

    if (!question || typeof question !== 'string') {
      return res.status(400).json({
        error: 'Question is required',
        code: 'INVALID_REQUEST',
      });
    }

    console.log('[CHAT API] Fetching guide:', guideId);

    // Fetch the guide and verify ownership
    const { data: guide, error: guideError } = await supabase
      .from('guides')
      .select('id, title, user_id')
      .eq('id', guideId)
      .eq('user_id', user.id)
      .single();

    if (guideError || !guide) {
      console.error('[CHAT API] Guide not found or access denied:', guideError);
      return res.status(404).json({
        error: 'Guide not found',
        code: 'NOT_FOUND',
      });
    }

    // Fetch the guide content
    const { data: content, error: contentError } = await supabase
      .from('guide_content')
      .select('processed_content, raw_content')
      .eq('guide_id', guideId)
      .single();

    if (contentError || !content) {
      console.error('[CHAT API] Content not found:', contentError);
      return res.status(404).json({
        error: 'Guide content not found',
        code: 'CONTENT_NOT_FOUND',
      });
    }

    console.log('[CHAT API] Generating AI response...');

    // Generate AI response using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a helpful documentation assistant. Answer questions about the following documentation clearly and concisely.

Documentation Title: ${guide.title}

Documentation Content:
${content.processed_content?.markdown || content.raw_content}

Answer questions based on this documentation. If the answer is not in the documentation, say so politely and suggest what information is available.`,
        },
        {
          role: 'user',
          content: question,
        },
      },
      temperature: 0.7,
      max_tokens: 1000,
    });

    const answer = completion.choices[0].message.content;

    console.log('[CHAT API] Response generated successfully');

    return res.status(200).json({
      answer,
      question,
      guideId,
    });
  } catch (error) {
    console.error('[CHAT API] Error:', error);

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
