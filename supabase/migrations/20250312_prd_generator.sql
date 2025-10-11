-- PRD Generator schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tables -------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS prd_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  project_type TEXT NOT NULL,
  structure JSONB NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prd_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL,
  template_id UUID REFERENCES prd_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  project_name TEXT NOT NULL,
  project_type TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'approved', 'archived')),
  content JSONB NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  version INTEGER DEFAULT 1,
  parent_document_id UUID REFERENCES prd_documents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prd_generation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prd_document_id UUID REFERENCES prd_documents(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL,
  generation_params JSONB NOT NULL,
  ai_model TEXT DEFAULT 'gpt-4o-mini',
  tokens_used INTEGER,
  generation_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes ------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_prd_documents_user_id ON prd_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_prd_documents_status ON prd_documents(status);
CREATE INDEX IF NOT EXISTS idx_prd_documents_project_type ON prd_documents(project_type);
CREATE INDEX IF NOT EXISTS idx_prd_templates_project_type ON prd_templates(project_type);
CREATE INDEX IF NOT EXISTS idx_prd_history_user_id ON prd_generation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_prd_history_document_id ON prd_generation_history(prd_document_id);

-- Row Level Security -------------------------------------------------------

ALTER TABLE prd_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE prd_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE prd_generation_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own PRD documents" ON prd_documents;
CREATE POLICY "Users can view their own PRD documents"
  ON prd_documents FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own PRD documents" ON prd_documents;
CREATE POLICY "Users can create their own PRD documents"
  ON prd_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own PRD documents" ON prd_documents;
CREATE POLICY "Users can update their own PRD documents"
  ON prd_documents FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own PRD documents" ON prd_documents;
CREATE POLICY "Users can delete their own PRD documents"
  ON prd_documents FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view public templates or their own" ON prd_templates;
CREATE POLICY "Users can view public templates or their own"
  ON prd_templates FOR SELECT
  USING (is_public = true OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can create templates" ON prd_templates;
CREATE POLICY "Users can create templates"
  ON prd_templates FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their own templates" ON prd_templates;
CREATE POLICY "Users can update their own templates"
  ON prd_templates FOR UPDATE
  USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their own templates" ON prd_templates;
CREATE POLICY "Users can delete their own templates"
  ON prd_templates FOR DELETE
  USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can view their own generation history" ON prd_generation_history;
CREATE POLICY "Users can view their own generation history"
  ON prd_generation_history FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own generation history" ON prd_generation_history;
CREATE POLICY "Users can create their own generation history"
  ON prd_generation_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Updated at helper --------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_prd_documents_updated_at ON prd_documents;
CREATE TRIGGER update_prd_documents_updated_at
  BEFORE UPDATE ON prd_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_prd_templates_updated_at ON prd_templates;
CREATE TRIGGER update_prd_templates_updated_at
  BEFORE UPDATE ON prd_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
