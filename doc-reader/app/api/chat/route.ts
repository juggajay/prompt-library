import { streamText } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { chatModel } from '@/lib/openai';
import { generateQueryEmbedding } from '@/lib/text-processing';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { messages, guideId } = await req.json();

    if (!guideId) {
      return new Response('Guide ID required', { status: 400 });
    }

    // Verify user has access to this guide
    const { data: guide } = await supabase
      .from('guides')
      .select('id')
      .eq('id', guideId)
      .eq('user_id', user.id)
      .single();

    if (!guide) {
      return new Response('Guide not found', { status: 404 });
    }

    // Get the last user message for RAG search
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();

    // Retrieve relevant context from knowledge base
    let context = '';
    if (lastUserMessage) {
      try {
        const queryEmbedding = await generateQueryEmbedding(lastUserMessage.content);
        const { data: chunks } = await supabase.rpc('match_guide_chunks', {
          query_embedding: queryEmbedding,
          match_threshold: 0.78,
          match_count: 4,
          filter_guide_id: guideId,
        });

        if (chunks && chunks.length > 0) {
          context = chunks
            .map((chunk: any) => `Section: ${chunk.section_title || 'Unknown'}\n${chunk.content}`)
            .join('\n\n---\n\n');
        }
      } catch (error) {
        console.error('Failed to retrieve context:', error);
      }
    }

    const result = streamText({
      model: chatModel,
      messages,
      system: `You are a helpful documentation assistant. Answer questions based on the provided context from the documentation.

${context ? `Context from documentation:\n\n${context}\n\n` : ''}

When answering:
- Only use information from the provided context
- Cite which section the information comes from
- If you cannot find relevant information in the context, say so clearly
- Be concise and accurate`,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Chat error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
