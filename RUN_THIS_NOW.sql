-- ================================================================
-- COPY THIS ENTIRE FILE AND PASTE INTO SUPABASE SQL EDITOR
-- Press CTRL+A to select all, CTRL+C to copy
-- Then go to: https://supabase.com/dashboard/project/ihpojtawsvzawycxkhzy/sql
-- Paste and click RUN
-- ================================================================

-- 1. CREATE FOLDERS TABLE
CREATE TABLE IF NOT EXISTS folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'purple',
  description TEXT,
  parent_folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own folders" ON folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own folders" ON folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own folders" ON folders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own folders" ON folders FOR DELETE USING (auth.uid() = user_id);

-- 2. ADD MISSING COLUMNS TO PROMPTS TABLE
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS was_improved BOOLEAN DEFAULT FALSE;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS original_version TEXT;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS improvement_history JSONB DEFAULT '[]';

-- 3. CREATE PROMPT IMPROVEMENTS CACHE TABLE
CREATE TABLE IF NOT EXISTS prompt_improvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_prompt TEXT NOT NULL,
  original_hash TEXT NOT NULL UNIQUE,
  improved_prompt TEXT NOT NULL,
  changes_made JSONB NOT NULL,
  reasoning TEXT,
  model_used VARCHAR(50) DEFAULT 'gpt-4o-mini',
  tokens_used INTEGER,
  cost_usd DECIMAL(10, 6),
  usage_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  clarity_score DECIMAL(3,2),
  specificity_score DECIMAL(3,2),
  structure_score DECIMAL(3,2),
  overall_score DECIMAL(3,2)
);

ALTER TABLE prompt_improvements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all" ON prompt_improvements FOR SELECT USING (true);
CREATE POLICY "Allow insert for authenticated users" ON prompt_improvements FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 4. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_folder_id ON prompts(folder_id);
CREATE INDEX IF NOT EXISTS idx_prompt_improvements_hash ON prompt_improvements(original_hash);

-- 5. VERIFY EVERYTHING WAS CREATED
SELECT
  'SUCCESS! All tables created.' as message,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'folders') as folders_table,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'prompt_improvements') as improvements_table,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'prompts' AND column_name IN ('folder_id', 'was_improved', 'original_version', 'improvement_history')) as new_columns_added;

-- If you see folders_table=1, improvements_table=1, new_columns_added=4, then SUCCESS!
-- Now refresh your browser and the errors should be gone!
