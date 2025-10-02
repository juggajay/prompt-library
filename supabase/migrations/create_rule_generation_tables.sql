-- Project rules conversation sessions
CREATE TABLE IF NOT EXISTS rule_generation_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Session data
  status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'
  project_type TEXT, -- 'web_app', 'mobile_app', 'api', 'data_pipeline', etc.
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
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Individual conversation messages
CREATE TABLE IF NOT EXISTS rule_conversation_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES rule_generation_sessions(id) ON DELETE CASCADE,

  role TEXT NOT NULL, -- 'assistant', 'user', 'system'
  content TEXT NOT NULL,

  -- For AI messages that ask questions
  question_data JSONB, -- { category, reasoning, options, isRequired }

  -- For user responses
  response_data JSONB, -- { answeredQuestionId, extractedInfo }

  created_at TIMESTAMP DEFAULT NOW()
);

-- Rule templates for reusability
CREATE TABLE IF NOT EXISTS project_rule_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  name TEXT NOT NULL,
  description TEXT,
  project_types TEXT[], -- Which project types this applies to
  technologies TEXT[], -- Which tech stacks this applies to

  -- Template rules
  rules JSONB NOT NULL,
  priority_levels JSONB, -- Default priorities for each rule

  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(3,2),

  -- Metadata
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rule_sessions_prompt ON rule_generation_sessions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_rule_sessions_user ON rule_generation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_rule_sessions_status ON rule_generation_sessions(status);
CREATE INDEX IF NOT EXISTS idx_rule_messages_session ON rule_conversation_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_rule_templates_types ON project_rule_templates USING GIN(project_types);
CREATE INDEX IF NOT EXISTS idx_rule_templates_tech ON project_rule_templates USING GIN(technologies);

-- Row Level Security
ALTER TABLE rule_generation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_rule_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own rule sessions" ON rule_generation_sessions;
DROP POLICY IF EXISTS "Users can manage messages in their sessions" ON rule_conversation_messages;
DROP POLICY IF EXISTS "Users can view public templates and manage their own" ON project_rule_templates;
DROP POLICY IF EXISTS "Users can create their own templates" ON project_rule_templates;

-- Create RLS policies
CREATE POLICY "Users can manage their own rule sessions"
  ON rule_generation_sessions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage messages in their sessions"
  ON rule_conversation_messages FOR ALL
  USING (
    session_id IN (
      SELECT id FROM rule_generation_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view public templates and manage their own"
  ON project_rule_templates FOR SELECT
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create their own templates"
  ON project_rule_templates FOR INSERT
  WITH CHECK (created_by = auth.uid());
