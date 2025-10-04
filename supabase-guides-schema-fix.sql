-- Fix source_url column - remove NOT NULL constraint for existing rows
ALTER TABLE public.guides
DROP COLUMN IF EXISTS source_url,
DROP COLUMN IF EXISTS source_hash,
DROP COLUMN IF EXISTS ai_provider,
DROP COLUMN IF EXISTS ai_model;

-- Re-add columns without NOT NULL constraint (except for new inserts)
ALTER TABLE public.guides
ADD COLUMN source_url TEXT,
ADD COLUMN source_hash TEXT,
ADD COLUMN ai_provider TEXT DEFAULT 'openai',
ADD COLUMN ai_model TEXT DEFAULT 'gpt-4o';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_guides_source_url ON public.guides(source_url);
CREATE INDEX IF NOT EXISTS idx_guides_source_hash ON public.guides(source_hash);
CREATE INDEX IF NOT EXISTS idx_guides_user_source ON public.guides(user_id, source_url);
