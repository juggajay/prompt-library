-- Prompt Improvement Feature - Database Migrations
-- Run this in your Supabase SQL Editor

-- ============================================
-- Step 1: Create prompt_improvements table
-- ============================================

CREATE TABLE IF NOT EXISTS prompt_improvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Original prompt data
  original_prompt TEXT NOT NULL,
  original_hash TEXT NOT NULL UNIQUE, -- MD5 hash for quick lookup

  -- Improved prompt data
  improved_prompt TEXT NOT NULL,
  changes_made JSONB NOT NULL, -- Array of changes
  reasoning TEXT,

  -- Metadata
  model_used VARCHAR(50) DEFAULT 'gpt-4o-mini',
  tokens_used INTEGER,
  cost_usd DECIMAL(10, 6),

  -- Analytics
  usage_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Quality scores (0.0 to 1.0)
  clarity_score DECIMAL(3,2),
  specificity_score DECIMAL(3,2),
  structure_score DECIMAL(3,2),
  overall_score DECIMAL(3,2)
);

-- Index for fast hash lookups
CREATE INDEX IF NOT EXISTS idx_prompt_improvements_hash
  ON prompt_improvements(original_hash);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_prompt_improvements_usage
  ON prompt_improvements(usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_prompt_improvements_created
  ON prompt_improvements(created_at DESC);

-- ============================================
-- Step 2: Enable Row Level Security
-- ============================================

ALTER TABLE prompt_improvements ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read cached improvements (they're anonymous)
CREATE POLICY "Allow read access to all"
  ON prompt_improvements FOR SELECT
  USING (true);

-- Policy: Only authenticated users can insert
CREATE POLICY "Allow insert for authenticated users"
  ON prompt_improvements FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- Step 3: Function to increment usage count
-- ============================================

CREATE OR REPLACE FUNCTION increment_improvement_usage(improvement_id UUID)
RETURNS void AS $$
  UPDATE prompt_improvements
  SET
    usage_count = usage_count + 1,
    last_used_at = NOW()
  WHERE id = improvement_id;
$$ LANGUAGE sql;

-- ============================================
-- Step 4: Update prompts table
-- ============================================

-- Add columns to track improvements made to each prompt
ALTER TABLE prompts
ADD COLUMN IF NOT EXISTS improvement_history JSONB DEFAULT '[]';

ALTER TABLE prompts
ADD COLUMN IF NOT EXISTS was_improved BOOLEAN DEFAULT FALSE;

ALTER TABLE prompts
ADD COLUMN IF NOT EXISTS original_version TEXT;

-- Index for querying improved prompts
CREATE INDEX IF NOT EXISTS idx_prompts_was_improved
  ON prompts(was_improved)
  WHERE was_improved = TRUE;

-- ============================================
-- Step 5: Verification query
-- ============================================

-- Run this to verify tables were created successfully:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_name IN ('prompt_improvements');

-- Run this to verify columns were added:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'prompts'
-- AND column_name IN ('improvement_history', 'was_improved', 'original_version');
