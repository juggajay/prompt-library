-- Add missing columns to guides table
ALTER TABLE public.guides
ADD COLUMN IF NOT EXISTS source_url TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS source_hash TEXT,
ADD COLUMN IF NOT EXISTS ai_provider TEXT DEFAULT 'openai',
ADD COLUMN IF NOT EXISTS ai_model TEXT DEFAULT 'gpt-4o';

-- Create index on source_url and source_hash for faster lookups
CREATE INDEX IF NOT EXISTS idx_guides_source_url ON public.guides(source_url);
CREATE INDEX IF NOT EXISTS idx_guides_source_hash ON public.guides(source_hash);
CREATE INDEX IF NOT EXISTS idx_guides_user_source ON public.guides(user_id, source_url);
