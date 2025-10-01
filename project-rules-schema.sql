-- ================================================================
-- PROJECT RULES GENERATOR - DATABASE SCHEMA
-- Copy and run this in Supabase SQL Editor
-- ================================================================

-- 1. PROJECT RULES CONVERSATION SESSIONS
CREATE TABLE IF NOT EXISTS rule_generation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Session data
  status TEXT NOT NULL DEFAULT 'in_progress',
  project_type TEXT,
  detected_technologies JSONB DEFAULT '[]'::jsonb,
  confidence_score DECIMAL(3,2),

  -- Conversation state
  current_question_index INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  questions_asked JSONB DEFAULT '[]'::jsonb,
  user_responses JSONB DEFAULT '{}'::jsonb,

  -- Generated rules
  generated_rules JSONB,
  rule_categories TEXT[],

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 2. INDIVIDUAL CONVERSATION MESSAGES
CREATE TABLE IF NOT EXISTS rule_conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES rule_generation_sessions(id) ON DELETE CASCADE NOT NULL,

  role TEXT NOT NULL,
  content TEXT NOT NULL,

  -- For AI messages that ask questions
  question_data JSONB,

  -- For user responses
  response_data JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RULE TEMPLATES FOR REUSABILITY
CREATE TABLE IF NOT EXISTS project_rule_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  description TEXT,
  project_types TEXT[],
  technologies TEXT[],

  -- Template rules
  rules JSONB NOT NULL,
  priority_levels JSONB,

  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(3,2),

  -- Metadata
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_rule_sessions_prompt ON rule_generation_sessions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_rule_sessions_user ON rule_generation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_rule_sessions_status ON rule_generation_sessions(status);
CREATE INDEX IF NOT EXISTS idx_rule_messages_session ON rule_conversation_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_rule_templates_types ON project_rule_templates USING GIN(project_types);
CREATE INDEX IF NOT EXISTS idx_rule_templates_tech ON project_rule_templates USING GIN(technologies);

-- 5. ENABLE ROW LEVEL SECURITY
ALTER TABLE rule_generation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_rule_templates ENABLE ROW LEVEL SECURITY;

-- 6. CREATE POLICIES
DROP POLICY IF EXISTS "Users can manage their own rule sessions" ON rule_generation_sessions;
CREATE POLICY "Users can manage their own rule sessions"
  ON rule_generation_sessions FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage messages in their sessions" ON rule_conversation_messages;
CREATE POLICY "Users can manage messages in their sessions"
  ON rule_conversation_messages FOR ALL
  USING (
    session_id IN (
      SELECT id FROM rule_generation_sessions WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view public templates and manage their own" ON project_rule_templates;
CREATE POLICY "Users can view public templates and manage their own"
  ON project_rule_templates FOR SELECT
  USING (is_public = true OR created_by = auth.uid());

DROP POLICY IF EXISTS "Users can create their own templates" ON project_rule_templates;
CREATE POLICY "Users can create their own templates"
  ON project_rule_templates FOR INSERT
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update their own templates" ON project_rule_templates;
CREATE POLICY "Users can update their own templates"
  ON project_rule_templates FOR UPDATE
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own templates" ON project_rule_templates;
CREATE POLICY "Users can delete their own templates"
  ON project_rule_templates FOR DELETE
  USING (created_by = auth.uid());

-- 7. VERIFY EVERYTHING WAS CREATED
SELECT
  'SUCCESS! Project Rules Generator tables created.' as message,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'rule_generation_sessions') as sessions_table,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'rule_conversation_messages') as messages_table,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'project_rule_templates') as templates_table;
