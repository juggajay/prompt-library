-- Create guides table
CREATE TABLE IF NOT EXISTS public.guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  processing_status TEXT NOT NULL DEFAULT 'queued' CHECK (processing_status IN ('queued', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create guide_content table
CREATE TABLE IF NOT EXISTS public.guide_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES public.guides(id) ON DELETE CASCADE,
  raw_content TEXT,
  processed_content JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create guide_chunks table (for vector search if needed)
CREATE TABLE IF NOT EXISTS public.guide_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES public.guides(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  metadata JSONB,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_guides_user_id ON public.guides(user_id);
CREATE INDEX IF NOT EXISTS idx_guides_status ON public.guides(processing_status);
CREATE INDEX IF NOT EXISTS idx_guide_content_guide_id ON public.guide_content(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_chunks_guide_id ON public.guide_chunks(guide_id);

-- Enable RLS
ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_chunks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for guides
CREATE POLICY "Users can view own guides"
  ON public.guides FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own guides"
  ON public.guides FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own guides"
  ON public.guides FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own guides"
  ON public.guides FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for guide_content (via guides)
CREATE POLICY "Users can view own guide content"
  ON public.guide_content FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.guides
      WHERE guides.id = guide_content.guide_id
      AND guides.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own guide content"
  ON public.guide_content FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.guides
      WHERE guides.id = guide_content.guide_id
      AND guides.user_id = auth.uid()
    )
  );

-- RLS Policies for guide_chunks (via guides)
CREATE POLICY "Users can view own guide chunks"
  ON public.guide_chunks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.guides
      WHERE guides.id = guide_chunks.guide_id
      AND guides.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own guide chunks"
  ON public.guide_chunks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.guides
      WHERE guides.id = guide_chunks.guide_id
      AND guides.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_guides_updated_at
  BEFORE UPDATE ON public.guides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
