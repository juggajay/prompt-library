import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { inngest } from '@/inngest/client';
import { processUrlSchema, hashURL } from '@/lib/validators';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    // Parse and validate request
    const body = await request.json();
    const validation = processUrlSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', code: 'INVALID_REQUEST', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { url, forceRefresh } = validation.data;
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
        return NextResponse.json({
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
      return NextResponse.json(
        { error: 'Failed to create guide', code: 'CREATE_FAILED' },
        { status: 500 }
      );
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

    return NextResponse.json(
      {
        id: guide.id,
        status: 'queued',
        message: 'Processing started',
      },
      { status: 202 }
    );
  } catch (error) {
    console.error('Error processing URL:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON', code: 'INVALID_JSON' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
