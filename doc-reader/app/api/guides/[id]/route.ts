import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch guide with content
    const { data: guide, error: guideError } = await supabase
      .from('guides')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (guideError || !guide) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
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

    return NextResponse.json({
      ...guide,
      content,
    });
  } catch (error) {
    console.error('Error fetching guide:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete guide (cascades to content and chunks)
    const { error } = await supabase.from('guides').delete().eq('id', id).eq('user_id', user.id);

    if (error) {
      console.error('Failed to delete guide:', error);
      return NextResponse.json({ error: 'Failed to delete guide' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting guide:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
