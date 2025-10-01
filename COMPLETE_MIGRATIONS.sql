-- ================================================================
-- COMPLETE MIGRATIONS FOR PROMPT LIBRARY
-- Run this entire file in Supabase SQL Editor
-- This includes: folders, improvement tracking, and all missing fields
-- ================================================================

-- ================================================================
-- PART 1: FOLDERS SYSTEM
-- ================================================================

-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'purple',
  description TEXT,
  parent_folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security for folders
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own folders" ON folders;
DROP POLICY IF EXISTS "Users can create own folders" ON folders;
DROP POLICY IF EXISTS "Users can update own folders" ON folders;
DROP POLICY IF EXISTS "Users can delete own folders" ON folders;

-- Policies for folders
CREATE POLICY "Users can view own folders"
  ON folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own folders"
  ON folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
  ON folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
  ON folders FOR DELETE
  USING (auth.uid() = user_id);

-- Add folder_id column to prompts table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompts' AND column_name = 'folder_id'
  ) THEN
    ALTER TABLE prompts ADD COLUMN folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_prompts_folder_id ON prompts(folder_id);
CREATE INDEX IF NOT EXISTS idx_prompts_user_folder ON prompts(user_id, folder_id);

-- ================================================================
-- PART 2: PROMPT IMPROVEMENTS TRACKING
-- ================================================================

-- Add improvement tracking columns to prompts table
DO $$
BEGIN
  -- Add was_improved column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompts' AND column_name = 'was_improved'
  ) THEN
    ALTER TABLE prompts ADD COLUMN was_improved BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add original_version column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompts' AND column_name = 'original_version'
  ) THEN
    ALTER TABLE prompts ADD COLUMN original_version TEXT;
  END IF;

  -- Add improvement_history column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompts' AND column_name = 'improvement_history'
  ) THEN
    ALTER TABLE prompts ADD COLUMN improvement_history JSONB DEFAULT '[]';
  END IF;
END $$;

-- Create index for querying improved prompts
CREATE INDEX IF NOT EXISTS idx_prompts_was_improved
  ON prompts(was_improved)
  WHERE was_improved = TRUE;

-- ================================================================
-- PART 3: PROMPT IMPROVEMENTS CACHE TABLE
-- ================================================================

-- Create prompt_improvements table for caching
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

-- Indexes for prompt_improvements
CREATE INDEX IF NOT EXISTS idx_prompt_improvements_hash
  ON prompt_improvements(original_hash);

CREATE INDEX IF NOT EXISTS idx_prompt_improvements_usage
  ON prompt_improvements(usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_prompt_improvements_created
  ON prompt_improvements(created_at DESC);

-- Enable Row Level Security
ALTER TABLE prompt_improvements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access to all" ON prompt_improvements;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON prompt_improvements;

-- Policy: Anyone can read cached improvements (they're anonymous)
CREATE POLICY "Allow read access to all"
  ON prompt_improvements FOR SELECT
  USING (true);

-- Policy: Only authenticated users can insert
CREATE POLICY "Allow insert for authenticated users"
  ON prompt_improvements FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ================================================================
-- PART 4: UTILITY FUNCTIONS
-- ================================================================

-- Function to increment improvement usage count
CREATE OR REPLACE FUNCTION increment_improvement_usage(improvement_id UUID)
RETURNS void AS $$
  UPDATE prompt_improvements
  SET
    usage_count = usage_count + 1,
    last_used_at = NOW()
  WHERE id = improvement_id;
$$ LANGUAGE sql;

-- Update the updated_at trigger for folders (ensure it exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for folders if not exists
DROP TRIGGER IF EXISTS update_folders_updated_at ON folders;
CREATE TRIGGER update_folders_updated_at
  BEFORE UPDATE ON folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- PART 5: VERIFICATION QUERIES
-- ================================================================

-- Run these to verify everything was created successfully:

-- Check folders table exists
SELECT 'Folders table created' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'folders'
);

-- Check prompt_improvements table exists
SELECT 'Prompt improvements table created' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'prompt_improvements'
);

-- Check new columns were added to prompts
SELECT 'Improvement columns added to prompts' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'prompts'
    AND column_name IN ('was_improved', 'original_version', 'improvement_history', 'folder_id')
  HAVING COUNT(*) = 4
);

-- List all columns in prompts table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'prompts'
ORDER BY ordinal_position;

-- ================================================================
-- MIGRATION COMPLETE!
-- ================================================================
-- If you see no errors above, all migrations were successful.
-- You can now use the folder system and prompt improvement features.
-- ================================================================
